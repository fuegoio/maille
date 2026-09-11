import { ActivityType, getActivitySharingsReconciliation } from "@maille/core/activities";
import {
  buildAddTransactionEntry,
  buildRemoveTransactionEntry,
  buildUnlinkEntry,
  buildUpdateTransactionEntry,
  diffTransaction,
} from "@maille/core/history";
import { builder } from "../builder";
import {
  ActivityCategorySchema,
  ActivitySchema,
  ActivitySharingSchema,
  ActivitySubCategorySchema,
  DeleteActivityResponseSchema,
  DeleteTransactionResponseSchema,
  TransactionSchema,
} from "./schemas";
import {
  accounts,
  activities,
  activitiesSharing,
  activityCategories,
  activitySubcategories,
  assets,
  contacts,
  counterparties,
  movements,
  movementsActivities,
  transactions,
} from "@/tables";
import { db } from "@/database";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "@/api/events";
import { computeHistory, emitHistoryEvents } from "@/api/history/history";
import { loadHistoryLabels, transactionLeg } from "@/api/history/labels";
import { getActivitySharings } from "@/services/sharing";
import {
  buildTransactionFundMoves,
  serializeFundMoves,
  toFundMoves,
} from "@/api/funds/transactions";
import type { FundMove } from "@maille/core/funds";
import { and, eq, like, ne } from "drizzle-orm";
import { z } from "zod";
import { GraphQLError } from "graphql";
import { logger } from "@/logger";
import { createActivity, updateActivity } from "@/services/activities";

const TransactionInput = builder.inputType("TransactionInput", {
  fields: (t) => ({
    id: t.field({
      type: "String",
    }),
    amount: t.float(),
    fromAccount: t.field({ type: "String" }),
    fromAsset: t.field({ type: "String", required: false }),
    fromCounterparty: t.field({ type: "String", required: false }),
    toAccount: t.field({ type: "String" }),
    toAsset: t.field({ type: "String", required: false }),
    toCounterparty: t.field({ type: "String", required: false }),
    fundMoves: t.field({ type: [FundMoveInput], required: false }),
  }),
});

const FundMoveInput = builder.inputType("FundMoveInput", {
  fields: (t) => ({
    id: t.field({ type: "String" }),
    fromFund: t.field({ type: "String", required: false }),
    toFund: t.field({ type: "String", required: false }),
    amount: t.float(),
    note: t.field({ type: "String", required: false }),
  }),
});

const ActivityMovementInput = builder.inputType("ActivityMovementInput", {
  fields: (t) => ({
    id: t.field({
      type: "String",
    }),
    movement: t.field({
      type: "String",
    }),
    amount: t.float(),
  }),
});

export const registerActivitiesMutations = () => {
  builder.mutationField("createActivity", (t) =>
    t.field({
      type: ActivitySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg.string(),
        description: t.arg.string({ required: false }),
        date: t.arg({ type: "Date" }),
        type: t.arg.string(),
        category: t.arg({
          type: "String",
          required: false,
        }),
        subcategory: t.arg({
          type: "String",
          required: false,
        }),
        project: t.arg({
          type: "String",
          required: false,
        }),
        transactions: t.arg({
          type: [TransactionInput],
          required: false,
        }),
        movement: t.arg({
          type: ActivityMovementInput,
          required: false,
        }),
      },
      resolve: (root, args, ctx) => createActivity(ctx.user.id, ctx.session.id, args),
    }),
  );

  builder.mutationField("updateActivity", (t) =>
    t.field({
      type: ActivitySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg({
          type: "String",
          required: false,
        }),
        description: t.arg({
          type: "String",
          required: false,
        }),
        date: t.arg({
          type: "Date",
          required: false,
        }),
        type: t.arg({
          type: "String",
          required: false,
        }),
        category: t.arg({
          type: "String",
          required: false,
        }),
        subcategory: t.arg({
          type: "String",
          required: false,
        }),
        project: t.arg({
          type: "String",
          required: false,
        }),
      },
      resolve: (root, args, ctx) => updateActivity(ctx.user.id, ctx.session.id, args),
    }),
  );

  builder.mutationField("deleteActivity", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(and(like(activities.id, idPattern(args.id)), eq(activities.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!activity) {
          return {
            id: args.id,
            success: true,
          };
        }

        // Update activities sharing
        const sharingId = (
          await db
            .select()
            .from(activitiesSharing)
            .where(eq(activitiesSharing.activity, activity.id))
        )[0]?.sharingId;
        const activitySharings = sharingId
          ? await db
              .select()
              .from(activitiesSharing)
              .where(
                and(
                  ne(activitiesSharing.user, ctx.user.id),
                  eq(activitiesSharing.sharingId, sharingId),
                ),
              )
          : [];
        await db.delete(activitiesSharing).where(eq(activitiesSharing.activity, activity.id));
        activitySharings.forEach(async (as) => {
          const sharing = getActivitySharingsReconciliation(
            await getActivitySharings(as.activity, as.user),
            as.user,
          );
          await addEvent({
            type: "updateActivitySharing",
            payload: {
              activityId: as.activity,
              sharing: sharing,
            },
            createdAt: new Date(),
            clientId: ctx.session.id,
            user: as.user,
          });
        });

        // History: unlink entries on the movements this activity was linked to.
        const linkedMovements = await db
          .select({
            linkAmount: movementsActivities.amount,
            movement: movements,
          })
          .from(movementsActivities)
          .innerJoin(movements, eq(movementsActivities.movement, movements.id))
          .where(eq(movementsActivities.activity, activity.id));

        for (const { linkAmount, movement } of linkedMovements) {
          const { history, emitted } = computeHistory(ctx, movement.history, [
            buildUnlinkEntry(
              "movement",
              movement.id,
              {
                type: "activity",
                id: activity.id,
                label: activity.name,
              },
              linkAmount,
            ),
          ]);
          await db.update(movements).set({ history }).where(eq(movements.id, movement.id));
          await emitHistoryEvents(ctx, emitted);
        }

        await db.delete(activities).where(eq(activities.id, activity.id));

        void addEvent({
          type: "deleteActivity",
          payload: {
            id: activity.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          id: activity.id,
          success: true,
        };
      },
    }),
  );

  builder.mutationField("shareActivity", (t) =>
    t.field({
      type: [ActivitySharingSchema],
      args: {
        id: t.arg({
          type: "String",
        }),
        userId: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(and(like(activities.id, idPattern(args.id)), eq(activities.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        const contact = (
          await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.contact, args.userId), eq(contacts.user, ctx.user.id)))
        )[0];
        if (!contact) {
          throw new GraphQLError("Contact not found or doesn't belong to you");
        }

        const activitySharing = (
          await db
            .select()
            .from(activitiesSharing)
            .where(eq(activitiesSharing.activity, activity.id))
        )[0];
        let sharingId = activitySharing?.sharingId;

        if (!sharingId) {
          sharingId = crypto.randomUUID();
          await db.insert(activitiesSharing).values({
            id: crypto.randomUUID(),
            sharingId,
            user: ctx.user.id,
            activity: activity.id,
            role: "primary",
          });
        }

        const existingSharing = (
          await db
            .select()
            .from(activitiesSharing)
            .where(
              and(
                eq(activitiesSharing.sharingId, sharingId),
                eq(activitiesSharing.user, args.userId),
              ),
            )
        )[0];
        if (existingSharing) {
          throw new GraphQLError("Activity already shared with this user");
        }

        const newActivity = (
          await db
            .insert(activities)
            .values({
              id: crypto.randomUUID(),
              user: args.userId,
              name: activity.name,
              description: activity.description,
              date: activity.date,
              type: activity.type,
            })
            .returning()
        )[0];
        if (!newActivity) {
          throw new GraphQLError("Failed to share activity");
        }

        await db.insert(activitiesSharing).values({
          id: crypto.randomUUID(),
          sharingId: sharingId!,
          user: args.userId,
          activity: newActivity.id,
          role: "secondary",
        });

        const sharingForMe = getActivitySharingsReconciliation(
          await getActivitySharings(activity.id, ctx.user.id),
          ctx.user.id,
        );
        const sharingForContact = getActivitySharingsReconciliation(
          await getActivitySharings(newActivity.id, args.userId),
          args.userId,
        );

        void addEvent({
          type: "createActivity",
          payload: {
            ...newActivity,
            date: newActivity.date.toISOString(),
            transactions: [],
            sharing: sharingForContact,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: args.userId,
        });

        void addEvent({
          type: "updateActivitySharing",
          payload: {
            activityId: activity.id,
            sharing: sharingForMe,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return sharingForMe;
      },
    }),
  );

  builder.mutationField("addTransaction", (t) =>
    t.field({
      type: TransactionSchema,
      args: {
        activityId: t.arg({
          type: "String",
        }),
        id: t.arg({
          type: "String",
        }),
        amount: t.arg({
          type: "Float",
        }),
        fromAccount: t.arg({ type: "String" }),
        fromAsset: t.arg({ type: "String", required: false }),
        fromCounterparty: t.arg({ type: "String", required: false }),
        toAccount: t.arg({ type: "String" }),
        toAsset: t.arg({ type: "String", required: false }),
        toCounterparty: t.arg({ type: "String", required: false }),
        fundMoves: t.arg({ type: [FundMoveInput], required: false }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(
              and(
                like(activities.id, idPattern(args.activityId)),
                eq(activities.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        const fromAccount =
          (
            await db
              .select({ id: accounts.id })
              .from(accounts)
              .where(
                and(like(accounts.id, idPattern(args.fromAccount)), eq(accounts.user, ctx.user.id)),
              )
              .limit(1)
          )[0]?.id ?? args.fromAccount;
        const toAccount =
          (
            await db
              .select({ id: accounts.id })
              .from(accounts)
              .where(
                and(like(accounts.id, idPattern(args.toAccount)), eq(accounts.user, ctx.user.id)),
              )
              .limit(1)
          )[0]?.id ?? args.toAccount;
        const fromAsset = args.fromAsset
          ? (
              await db
                .select({ id: assets.id })
                .from(assets)
                .where(
                  and(like(assets.id, idPattern(args.fromAsset)), eq(assets.user, ctx.user.id)),
                )
                .limit(1)
            )[0]?.id
          : args.fromAsset;
        const toAsset = args.toAsset
          ? (
              await db
                .select({ id: assets.id })
                .from(assets)
                .where(and(like(assets.id, idPattern(args.toAsset)), eq(assets.user, ctx.user.id)))
                .limit(1)
            )[0]?.id
          : args.toAsset;
        const fromCounterparty = args.fromCounterparty
          ? (
              await db
                .select({ id: counterparties.id })
                .from(counterparties)
                .where(
                  and(
                    like(counterparties.id, idPattern(args.fromCounterparty)),
                    eq(counterparties.user, ctx.user.id),
                  ),
                )
                .limit(1)
            )[0]?.id
          : args.fromCounterparty;
        const toCounterparty = args.toCounterparty
          ? (
              await db
                .select({ id: counterparties.id })
                .from(counterparties)
                .where(
                  and(
                    like(counterparties.id, idPattern(args.toCounterparty)),
                    eq(counterparties.user, ctx.user.id),
                  ),
                )
                .limit(1)
            )[0]?.id
          : args.toCounterparty;

        const fundMoves = await buildTransactionFundMoves({
          userId: ctx.user.id,
          transactionDate: activity.date,
          amount: args.amount,
          fromAccount,
          toAccount,
          fundMovesInput: args.fundMoves,
        });
        const newTransactions = await db
          .insert(transactions)
          .values({
            id: args.id,
            amount: args.amount,
            fromAccount,
            toAccount,
            fromAsset,
            toAsset,
            fromCounterparty,
            toCounterparty,
            activity: activity.id,
            fundMoves,
          })
          .returning();
        const newTransaction = newTransactions[0];

        if (!newTransaction) {
          throw new GraphQLError("Failed to create transaction");
        }

        const newFundMoves = toFundMoves(newTransaction.id, fundMoves);

        await addEvent({
          type: "addTransaction",
          payload: {
            activityId: activity.id,
            ...newTransaction,
            fundMoves: serializeFundMoves(newFundMoves),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        // History: addTransaction entry on the activity timeline.
        const labels = await loadHistoryLabels(ctx.user.id);
        const { history: addTransactionHistory, emitted: addTransactionEmitted } = computeHistory(
          ctx,
          activity.history,
          [
            buildAddTransactionEntry("activity", activity.id, {
              amount: newTransaction.amount,
              from: transactionLeg(
                newTransaction.fromAccount,
                newTransaction.fromAsset,
                newTransaction.fromCounterparty,
                labels,
              ),
              to: transactionLeg(
                newTransaction.toAccount,
                newTransaction.toAsset,
                newTransaction.toCounterparty,
                labels,
              ),
            }),
          ],
        );
        await db
          .update(activities)
          .set({ history: addTransactionHistory })
          .where(eq(activities.id, activity.id));
        await emitHistoryEvents(ctx, addTransactionEmitted);

        // Update sharing
        const sharingId = (
          await db
            .select()
            .from(activitiesSharing)
            .where(eq(activitiesSharing.activity, activity.id))
        )[0]?.sharingId;
        const activitySharings = sharingId
          ? await db
              .select()
              .from(activitiesSharing)
              .where(eq(activitiesSharing.sharingId, sharingId))
          : [];

        logger.info({ newTransaction, activitySharings }, "Updating activity sharing");
        await Promise.all(
          activitySharings.map(async (activitySharing) => {
            await addEvent({
              type: "updateActivitySharing",
              payload: {
                activityId: activitySharing.activity,
                sharing: getActivitySharingsReconciliation(
                  await getActivitySharings(activitySharing.activity, activitySharing.user),
                  activitySharing.user,
                ),
              },
              createdAt: new Date(),
              clientId: ctx.session.id,
              user: activitySharing.user,
            });
          }),
        );

        return { ...newTransaction, fundMoves: newFundMoves };
      },
    }),
  );

  builder.mutationField("updateTransaction", (t) =>
    t.field({
      type: TransactionSchema,
      args: {
        activityId: t.arg({
          type: "String",
          required: true,
        }),
        id: t.arg({
          type: "String",
          required: true,
        }),
        amount: t.arg({
          type: "Float",
          required: false,
        }),
        fromAccount: t.arg({
          type: "String",
          required: false,
        }),
        fromAsset: t.arg({
          type: "String",
          required: false,
        }),
        fromCounterparty: t.arg({
          type: "String",
          required: false,
        }),
        toAccount: t.arg({
          type: "String",
          required: false,
        }),
        toAsset: t.arg({
          type: "String",
          required: false,
        }),
        toCounterparty: t.arg({
          type: "String",
          required: false,
        }),
        fundMoves: t.arg({ type: [FundMoveInput], required: false }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(
              and(
                like(activities.id, idPattern(args.activityId)),
                eq(activities.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        const transaction = (
          await db
            .select()
            .from(transactions)
            .where(
              and(
                like(transactions.id, idPattern(args.id)),
                eq(transactions.activity, activity.id),
              ),
            )
            .limit(1)
        )[0];
        if (!transaction) {
          throw new GraphQLError("Transaction not found");
        }

        const updatedFields: Partial<typeof transaction> = {};
        if (args.amount !== null && args.amount !== undefined) updatedFields.amount = args.amount;
        if (args.fromAccount)
          updatedFields.fromAccount =
            (
              await db
                .select({ id: accounts.id })
                .from(accounts)
                .where(
                  and(
                    like(accounts.id, idPattern(args.fromAccount)),
                    eq(accounts.user, ctx.user.id),
                  ),
                )
                .limit(1)
            )[0]?.id ?? args.fromAccount;
        if (args.fromAsset !== undefined)
          updatedFields.fromAsset = args.fromAsset
            ? (
                await db
                  .select({ id: assets.id })
                  .from(assets)
                  .where(
                    and(like(assets.id, idPattern(args.fromAsset)), eq(assets.user, ctx.user.id)),
                  )
                  .limit(1)
              )[0]?.id
            : args.fromAsset;
        if (args.fromCounterparty !== undefined)
          updatedFields.fromCounterparty = args.fromCounterparty
            ? (
                await db
                  .select({ id: counterparties.id })
                  .from(counterparties)
                  .where(
                    and(
                      like(counterparties.id, idPattern(args.fromCounterparty)),
                      eq(counterparties.user, ctx.user.id),
                    ),
                  )
                  .limit(1)
              )[0]?.id
            : args.fromCounterparty;
        if (args.toAccount)
          updatedFields.toAccount =
            (
              await db
                .select({ id: accounts.id })
                .from(accounts)
                .where(
                  and(like(accounts.id, idPattern(args.toAccount)), eq(accounts.user, ctx.user.id)),
                )
                .limit(1)
            )[0]?.id ?? args.toAccount;
        if (args.toAsset !== undefined)
          updatedFields.toAsset = args.toAsset
            ? (
                await db
                  .select({ id: assets.id })
                  .from(assets)
                  .where(
                    and(like(assets.id, idPattern(args.toAsset)), eq(assets.user, ctx.user.id)),
                  )
                  .limit(1)
              )[0]?.id
            : args.toAsset;
        if (args.toCounterparty !== undefined)
          updatedFields.toCounterparty = args.toCounterparty
            ? (
                await db
                  .select({ id: counterparties.id })
                  .from(counterparties)
                  .where(
                    and(
                      like(counterparties.id, idPattern(args.toCounterparty)),
                      eq(counterparties.user, ctx.user.id),
                    ),
                  )
                  .limit(1)
              )[0]?.id
            : args.toCounterparty;

        // Replace fund legs when provided (undefined = keep existing legs).
        // Legs live on the transaction row, stored with the activity's date.
        let updatedFundMoves: FundMove[] | null = null;
        if (args.fundMoves !== null && args.fundMoves !== undefined) {
          const legs = await buildTransactionFundMoves({
            userId: ctx.user.id,
            transactionDate: activity.date,
            amount:
              args.amount !== null && args.amount !== undefined ? args.amount : transaction.amount,
            fromAccount: updatedFields.fromAccount ?? transaction.fromAccount,
            toAccount: updatedFields.toAccount ?? transaction.toAccount,
            fundMovesInput: args.fundMoves,
          });
          updatedFundMoves = toFundMoves(transaction.id, legs);
          if (legs.length > 0 || (transaction.fundMoves ?? []).length > 0) {
            updatedFields.fundMoves = legs;
          }
        }

        const updatedTransactions =
          Object.keys(updatedFields).length > 0
            ? await db
                .update(transactions)
                .set(updatedFields)
                .where(eq(transactions.id, transaction.id))
                .returning()
            : await db.select().from(transactions).where(eq(transactions.id, transaction.id));
        const updatedTransaction = updatedTransactions[0];

        if (!updatedTransaction) {
          throw new GraphQLError("Failed to update transaction");
        }

        // The stored legs stay on the row; the event carries the serialized
        // moves instead.
        const { fundMoves: _storedLegs, ...updatedFieldsWithoutLegs } = updatedFields;

        await addEvent({
          type: "updateTransaction",
          payload: {
            activityId: transaction.activity,
            id: transaction.id,
            ...updatedFieldsWithoutLegs,
            ...(updatedFundMoves !== null
              ? { fundMoves: serializeFundMoves(updatedFundMoves) }
              : {}),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        // History: updateTransaction entry on the activity timeline.
        const labels = await loadHistoryLabels(ctx.user.id);
        const updateTransactionChanges = diffTransaction(
          {
            amount: transaction.amount,
            from: transactionLeg(
              transaction.fromAccount,
              transaction.fromAsset,
              transaction.fromCounterparty,
              labels,
            ),
            to: transactionLeg(
              transaction.toAccount,
              transaction.toAsset,
              transaction.toCounterparty,
              labels,
            ),
          },
          {
            amount: updatedTransaction.amount,
            from: transactionLeg(
              updatedTransaction.fromAccount,
              updatedTransaction.fromAsset,
              updatedTransaction.fromCounterparty,
              labels,
            ),
            to: transactionLeg(
              updatedTransaction.toAccount,
              updatedTransaction.toAsset,
              updatedTransaction.toCounterparty,
              labels,
            ),
          },
        );
        const updateTransactionEntry = buildUpdateTransactionEntry(
          "activity",
          activity.id,
          updateTransactionChanges,
        );
        if (updateTransactionEntry) {
          const { history, emitted } = computeHistory(ctx, activity.history, [
            updateTransactionEntry,
          ]);
          await db.update(activities).set({ history }).where(eq(activities.id, activity.id));
          await emitHistoryEvents(ctx, emitted);
        }

        // Update sharing
        const sharingId = (
          await db
            .select()
            .from(activitiesSharing)
            .where(eq(activitiesSharing.activity, transaction.activity))
        )[0]?.sharingId;
        const activitySharings = sharingId
          ? await db
              .select()
              .from(activitiesSharing)
              .where(eq(activitiesSharing.sharingId, sharingId))
          : [];

        logger.info({ updatedTransaction, activitySharings }, "Updating activity sharing");
        await Promise.all(
          activitySharings.map(async (activitySharing) => {
            await addEvent({
              type: "updateActivitySharing",
              payload: {
                activityId: activitySharing.activity,
                sharing: getActivitySharingsReconciliation(
                  await getActivitySharings(activitySharing.activity, activitySharing.user),
                  activitySharing.user,
                ),
              },
              createdAt: new Date(),
              clientId: ctx.session.id,
              user: activitySharing.user,
            });
          }),
        );

        return {
          ...updatedTransaction,
          fundMoves:
            updatedFundMoves ?? toFundMoves(updatedTransaction.id, updatedTransaction.fundMoves),
        };
      },
    }),
  );

  builder.mutationField("deleteTransaction", (t) =>
    t.field({
      type: DeleteTransactionResponseSchema,
      args: {
        activityId: t.arg({
          type: "String",
          required: true,
        }),
        id: t.arg({
          type: "String",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(
              and(
                like(activities.id, idPattern(args.activityId)),
                eq(activities.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        const transaction = (
          await db
            .select()
            .from(transactions)
            .where(
              and(
                like(transactions.id, idPattern(args.id)),
                eq(transactions.activity, activity.id),
              ),
            )
            .limit(1)
        )[0];
        if (!transaction) {
          throw new GraphQLError("Transaction not found");
        }

        await db.delete(transactions).where(eq(transactions.id, transaction.id));

        await addEvent({
          type: "deleteTransaction",
          payload: {
            activityId: transaction.activity,
            id: transaction.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        // History: removeTransaction entry on the activity timeline.
        const labels = await loadHistoryLabels(ctx.user.id);
        const { history, emitted } = computeHistory(ctx, activity.history, [
          buildRemoveTransactionEntry("activity", activity.id, {
            amount: transaction.amount,
            from: transactionLeg(
              transaction.fromAccount,
              transaction.fromAsset,
              transaction.fromCounterparty,
              labels,
            ),
            to: transactionLeg(
              transaction.toAccount,
              transaction.toAsset,
              transaction.toCounterparty,
              labels,
            ),
          }),
        ]);
        await db.update(activities).set({ history }).where(eq(activities.id, activity.id));
        await emitHistoryEvents(ctx, emitted);

        // Update sharing
        const sharingId = (
          await db
            .select()
            .from(activitiesSharing)
            .where(eq(activitiesSharing.activity, transaction.activity))
        )[0]?.sharingId;
        const activitySharings = sharingId
          ? await db
              .select()
              .from(activitiesSharing)
              .where(eq(activitiesSharing.sharingId, sharingId))
          : [];

        await Promise.all(
          activitySharings.map(async (activitySharing) => {
            await addEvent({
              type: "updateActivitySharing",
              payload: {
                activityId: activitySharing.activity,
                sharing: getActivitySharingsReconciliation(
                  await getActivitySharings(activitySharing.activity, activitySharing.user),
                  activitySharing.user,
                ),
              },
              createdAt: new Date(),
              clientId: ctx.session.id,
              user: activitySharing.user,
            });
          }),
        );

        return { id: transaction.id, success: true };
      },
    }),
  );

  builder.mutationField("createActivityCategory", (t) =>
    t.field({
      type: ActivityCategorySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg.string(),
        type: t.arg.string(),
        emoji: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const activityTypeSchema = z.enum(ActivityType);
        const parsedType = activityTypeSchema.parse(args.type);

        const category = {
          id: args.id,
          user: ctx.user.id,
          name: args.name,
          type: parsedType,
          emoji: args.emoji ?? null,
        };
        await db.insert(activityCategories).values(category);

        await addEvent({
          type: "createActivityCategory",
          payload: category,
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return category;
      },
    }),
  );

  builder.mutationField("updateActivityCategory", (t) =>
    t.field({
      type: ActivityCategorySchema,
      args: {
        id: t.arg({
          type: "String",
          required: true,
        }),
        name: t.arg.string(),
        emoji: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const category = (
          await db
            .select()
            .from(activityCategories)
            .where(
              and(
                like(activityCategories.id, idPattern(args.id)),
                eq(activityCategories.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!category) {
          throw new GraphQLError("Activity category not found");
        }

        const updates: Partial<typeof category> = {
          name: args.name,
        };

        // Optional fields
        if (args.emoji !== undefined) {
          updates.emoji = args.emoji;
        }

        const updatedCategories = await db
          .update(activityCategories)
          .set(updates)
          .where(eq(activityCategories.id, category.id))
          .returning();
        const updatedCategory = updatedCategories[0];

        if (!updatedCategory) {
          throw new GraphQLError("Failed to update activity category");
        }

        await addEvent({
          type: "updateActivityCategory",
          payload: {
            id: category.id,
            name: args.name,
            ...(args.emoji !== undefined && { emoji: args.emoji }),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedCategory;
      },
    }),
  );

  builder.mutationField("deleteActivityCategory", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "String",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const category = (
          await db
            .select()
            .from(activityCategories)
            .where(
              and(
                like(activityCategories.id, idPattern(args.id)),
                eq(activityCategories.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!category) {
          throw new GraphQLError("Activity category not found");
        }

        await db.delete(activityCategories).where(eq(activityCategories.id, category.id));

        await addEvent({
          type: "deleteActivityCategory",
          payload: {
            id: category.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return { id: category.id, success: true };
      },
    }),
  );

  builder.mutationField("createActivitySubCategory", (t) =>
    t.field({
      type: ActivitySubCategorySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg.string(),
        category: t.arg({
          type: "String",
        }),
        emoji: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const categoryRecord = (
          await db
            .select({ id: activityCategories.id })
            .from(activityCategories)
            .where(
              and(
                like(activityCategories.id, idPattern(args.category)),
                eq(activityCategories.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        const subcategory = {
          id: args.id,
          user: ctx.user.id,
          name: args.name,
          category: categoryRecord?.id ?? args.category,
          emoji: args.emoji ?? null,
        };
        await db.insert(activitySubcategories).values(subcategory);

        await addEvent({
          type: "createActivitySubCategory",
          payload: subcategory,
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return subcategory;
      },
    }),
  );

  builder.mutationField("updateActivitySubCategory", (t) =>
    t.field({
      type: ActivitySubCategorySchema,
      args: {
        id: t.arg({
          type: "String",
          required: true,
        }),
        name: t.arg.string(),
        emoji: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const subcategory = (
          await db
            .select()
            .from(activitySubcategories)
            .where(
              and(
                like(activitySubcategories.id, idPattern(args.id)),
                eq(activitySubcategories.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!subcategory) {
          throw new GraphQLError("Activity subcategory not found");
        }

        const updates: Partial<typeof subcategory> = {
          name: args.name,
        };

        // Optional fields
        if (args.emoji !== undefined) {
          updates.emoji = args.emoji;
        }

        const updatedSubCategories = await db
          .update(activitySubcategories)
          .set(updates)
          .where(eq(activitySubcategories.id, subcategory.id))
          .returning();
        const updatedSubCategory = updatedSubCategories[0];

        if (!updatedSubCategory) {
          throw new GraphQLError("Failed to update activity subcategory");
        }

        await addEvent({
          type: "updateActivitySubCategory",
          payload: {
            id: subcategory.id,
            name: args.name,
            ...(args.emoji !== undefined && { emoji: args.emoji }),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedSubCategory;
      },
    }),
  );

  builder.mutationField("deleteActivitySubCategory", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "String",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const subCategory = (
          await db
            .select()
            .from(activitySubcategories)
            .where(
              and(
                like(activitySubcategories.id, idPattern(args.id)),
                eq(activitySubcategories.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!subCategory) {
          throw new GraphQLError("Activity subcategory not found");
        }

        await db.delete(activitySubcategories).where(eq(activitySubcategories.id, subCategory.id));

        await addEvent({
          type: "deleteActivitySubCategory",
          payload: {
            id: subCategory.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return { id: subCategory.id, success: true };
      },
    }),
  );
};
