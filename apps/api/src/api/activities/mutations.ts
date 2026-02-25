import {
  ActivityType,
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  getActivitySharingsReconciliation,
  type ActivityMovement,
} from "@maille/core/activities";
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
  contacts,
  movements,
  movementsActivities,
  transactions,
} from "@/tables";
import { db } from "@/database";
import { addEvent } from "@/api/events";
import { getActivitySharings } from "@/services/sharing";
import { and, eq, max, ne } from "drizzle-orm";
import { z } from "zod";
import { GraphQLError } from "graphql";
import { logger } from "@/logger";

const TransactionInput = builder.inputType("TransactionInput", {
  fields: (t) => ({
    id: t.field({
      type: "String",
    }),
    amount: t.float(),
    fromAccount: t.field({ type: "String" }),
    toAccount: t.field({ type: "String" }),
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
      resolve: async (root, args, ctx) => {
        const ActivityTypeEnum = z.enum(ActivityType);
        const activityType = ActivityTypeEnum.parse(args.type);

        const accountsQuery = await db.select().from(accounts);
        const maxNumberResult = await db
          .select({ number: max(activities.number) })
          .from(activities)
          .where(eq(activities.user, ctx.user.id))
          .then((result) => result[0]);

        const number = maxNumberResult?.number ? maxNumberResult.number + 1 : 1;

        await db.insert(activities).values({
          id: args.id,
          number,
          user: ctx.user.id,
          name: args.name,
          description: args.description,
          date: new Date(args.date),
          type: activityType,
          category: args.category,
          subcategory: args.subcategory,
          project: args.project,
        });

        // Transactions
        const transactionPromises =
          args.transactions?.map(async (transaction) => {
            const transactionResults = await db
              .insert(transactions)
              .values({
                id: transaction.id,
                amount: transaction.amount,
                fromAccount: transaction.fromAccount,
                toAccount: transaction.toAccount,
                activity: args.id,
              })
              .returning();
            const newTransaction = transactionResults[0];

            if (!newTransaction) {
              throw new GraphQLError("Failed to create transaction");
            }

            return newTransaction;
          }) || [];

        const newTransactions = await Promise.all(transactionPromises);

        // Movements
        let newMovements: ActivityMovement[] = [];
        if (args.movement) {
          const movementActivity = {
            id: args.movement.id,
            user: ctx.user.id,
            activity: args.id,
            movement: args.movement.movement,
            amount: args.movement.amount,
          };
          await db.insert(movementsActivities).values(movementActivity);
          newMovements = [movementActivity];
        }

        await addEvent({
          type: "createActivity",
          payload: {
            id: args.id,
            number,
            name: args.name,
            description: args.description ?? null,
            date: args.date.toISOString(),
            type: activityType,
            category: args.category ?? null,
            subcategory: args.subcategory ?? null,
            project: args.project ?? null,
            transactions: newTransactions,
            movement: args.movement ? { ...args.movement } : undefined,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        const userMovements = await db
          .select()
          .from(movements)
          .where(eq(movements.user, ctx.user.id));

        return {
          id: args.id,
          number,
          users: [ctx.user.id],
          name: args.name,
          description: args.description ?? null,
          date: args.date,
          type: activityType,
          category: args.category ?? null,
          subcategory: args.subcategory ?? null,
          project: args.project ?? null,
          transactions: newTransactions,
          movements: newMovements,
          amount: getActivityTransactionsReconciliationSum(
            activityType,
            newTransactions,
            accountsQuery,
          ),
          status: getActivityStatus(
            args.date,
            newTransactions,
            newMovements,
            accountsQuery,
            (id) => {
              const movement = userMovements.find((m) => m.id === id);
              if (!movement) return;
              return {
                ...movement,
                date: movement.date,
                status: "completed",
                activities: [],
              };
            },
          ),
          sharing: getActivitySharingsReconciliation(
            await getActivitySharings(args.id, ctx.user.id),
            ctx.user.id,
          ),
        };
      },
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
      resolve: async (root, args, ctx) => {
        let activity = (
          await db
            .select()
            .from(activities)
            .where(and(eq(activities.id, args.id), eq(activities.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        const activityUpdates: Partial<typeof activity> = {};
        if (args.name) {
          activityUpdates.name = args.name;
        }
        if (args.description !== undefined) {
          activityUpdates.description = args.description;
        }
        if (args.date) {
          activityUpdates.date = args.date;
        }
        if (args.type) {
          const ActivityTypeEnum = z.enum(ActivityType);
          activityUpdates.type = ActivityTypeEnum.parse(args.type);
          activityUpdates.category = null;
          activityUpdates.subcategory = null;
        }

        // Optional fields
        if (args.category !== undefined) {
          activityUpdates.category = args.category;
          activityUpdates.subcategory = null;
        }
        if (args.subcategory !== undefined) {
          activityUpdates.subcategory = args.subcategory;
        }
        if (args.project !== undefined) {
          activityUpdates.project = args.project;
        }

        if (Object.keys(activityUpdates).length > 0) {
          const updatedActivities = await db
            .update(activities)
            .set(activityUpdates)
            .where(eq(activities.id, args.id))
            .returning();
          activity = updatedActivities[0];
          if (!activity) {
            throw new GraphQLError("Failed to update activity");
          }
        }

        void addEvent({
          type: "updateActivity",
          payload: {
            id: args.id,
            ...activityUpdates,
            date: activityUpdates.date?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        const accountsQuery = await db.select().from(accounts);
        const transactionsData = await db
          .select()
          .from(transactions)
          .where(eq(transactions.activity, args.id));
        const movementsData = await db
          .select()
          .from(movementsActivities)
          .where(eq(movementsActivities.activity, args.id));

        const userMovements = await db
          .select()
          .from(movements)
          .where(eq(movements.user, ctx.user.id));

        return {
          ...activity,
          date: activity.date,
          transactions: transactionsData,
          movements: movementsData,
          amount: getActivityTransactionsReconciliationSum(
            activity.type,
            transactionsData,
            accountsQuery,
          ),
          status: getActivityStatus(
            activity.date,
            transactionsData,
            movementsData,
            accountsQuery,
            (id) => {
              const movement = userMovements.find((m) => m.id === id);
              if (!movement) return;
              return {
                ...movement,
                date: movement.date,
                status: "completed",
                activities: [],
              };
            },
          ),
          sharing: getActivitySharingsReconciliation(
            await getActivitySharings(args.id, ctx.user.id),
            ctx.user.id,
          ),
        };
      },
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
            .where(and(eq(activities.id, args.id), eq(activities.user, ctx.user.id)))
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
          await db.select().from(activitiesSharing).where(eq(activitiesSharing.activity, args.id))
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
        await db.delete(activitiesSharing).where(eq(activitiesSharing.activity, args.id));
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

        await db.delete(activities).where(eq(activities.id, args.id));

        void addEvent({
          type: "deleteActivity",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          id: args.id,
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
            .where(and(eq(activities.id, args.id), eq(activities.user, ctx.user.id)))
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
          await db.select().from(activitiesSharing).where(eq(activitiesSharing.activity, args.id))
        )[0];
        let sharingId = activitySharing?.sharingId;

        if (!sharingId) {
          sharingId = crypto.randomUUID();
          await db.insert(activitiesSharing).values({
            id: crypto.randomUUID(),
            sharingId,
            user: ctx.user.id,
            activity: args.id,
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
              number: 0,
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
          await getActivitySharings(args.id, ctx.user.id),
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
            activityId: args.id,
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
        toAccount: t.arg({ type: "String" }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(and(eq(activities.id, args.activityId), eq(activities.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        // Validate accounts
        const fromAccount = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, args.fromAccount))
          .limit(1);
        if (!fromAccount) {
          throw new GraphQLError("From account not found");
        }

        const toAccount = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, args.toAccount))
          .limit(1);
        if (!toAccount) {
          throw new GraphQLError("To account not found");
        }

        const newTransactions = await db
          .insert(transactions)
          .values({
            id: args.id,
            amount: args.amount,
            fromAccount: args.fromAccount,
            toAccount: args.toAccount,
            activity: args.activityId,
          })
          .returning();
        const newTransaction = newTransactions[0];

        if (!newTransaction) {
          throw new GraphQLError("Failed to create transaction");
        }

        void addEvent({
          type: "addTransaction",
          payload: {
            activityId: args.activityId,
            ...newTransaction,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return newTransaction;
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
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(and(eq(activities.id, args.activityId), eq(activities.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        const transaction = (
          await db
            .select()
            .from(transactions)
            .where(and(eq(transactions.id, args.id), eq(transactions.activity, args.activityId)))
            .limit(1)
        )[0];
        if (!transaction) {
          throw new GraphQLError("Transaction not found");
        }

        // TODO: missing validation for accounts, assets and counterparties
        const updatedFields: Partial<typeof transaction> = {};
        if (args.amount !== null) updatedFields.amount = args.amount;
        if (args.fromAccount) updatedFields.fromAccount = args.fromAccount;
        if (args.fromAsset !== undefined) updatedFields.fromAsset = args.fromAsset;
        if (args.fromCounterparty !== undefined)
          updatedFields.fromCounterparty = args.fromCounterparty;
        if (args.toAccount) updatedFields.toAccount = args.toAccount;
        if (args.toAsset !== undefined) updatedFields.toAsset = args.toAsset;
        if (args.toCounterparty !== undefined) updatedFields.toCounterparty = args.toCounterparty;

        const updatedTransactions = await db
          .update(transactions)
          .set(updatedFields)
          .where(eq(transactions.id, args.id))
          .returning();
        const updatedTransaction = updatedTransactions[0];

        if (!updatedTransaction) {
          throw new GraphQLError("Failed to update transaction");
        }

        void addEvent({
          type: "updateTransaction",
          payload: {
            activityId: transaction.activity,
            id: args.id,
            ...updatedFields,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

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

        return updatedTransaction;
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
            .where(and(eq(activities.id, args.activityId), eq(activities.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        const transaction = (
          await db
            .select()
            .from(transactions)
            .where(and(eq(transactions.id, args.id), eq(transactions.activity, args.activityId)))
            .limit(1)
        )[0];
        if (!transaction) {
          throw new GraphQLError("Transaction not found");
        }

        await db.delete(transactions).where(eq(transactions.id, args.id));

        void addEvent({
          type: "deleteTransaction",
          payload: {
            activityId: transaction.activity,
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

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

        return { id: args.id, success: true };
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
      },
      resolve: async (root, args, ctx) => {
        const activityTypeSchema = z.enum(ActivityType);
        const parsedType = activityTypeSchema.parse(args.type);

        const category = {
          id: args.id,
          user: ctx.user.id,
          name: args.name,
          type: parsedType,
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
      },
      resolve: async (root, args, ctx) => {
        const category = (
          await db
            .select()
            .from(activityCategories)
            .where(eq(activityCategories.id, args.id))
            .limit(1)
        )[0];
        if (!category) {
          throw new GraphQLError("Activity category not found");
        }

        const updatedCategories = await db
          .update(activityCategories)
          .set({
            name: args.name,
          })
          .where(eq(activityCategories.id, args.id))
          .returning();
        const updatedCategory = updatedCategories[0];

        if (!updatedCategory) {
          throw new GraphQLError("Failed to update activity category");
        }

        await addEvent({
          type: "updateActivityCategory",
          payload: {
            id: args.id,
            name: args.name,
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
            .where(eq(activityCategories.id, args.id))
            .limit(1)
        )[0];
        if (!category) {
          throw new GraphQLError("Activity category not found");
        }

        await db.delete(activityCategories).where(eq(activityCategories.id, args.id));

        await addEvent({
          type: "deleteActivityCategory",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return { id: args.id, success: true };
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
      },
      resolve: async (root, args, ctx) => {
        const subcategory = {
          id: args.id,
          user: ctx.user.id,
          name: args.name,
          category: args.category,
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
      },
      resolve: async (root, args, ctx) => {
        const subcategory = (
          await db
            .select()
            .from(activitySubcategories)
            .where(eq(activitySubcategories.id, args.id))
            .limit(1)
        )[0];
        if (!subcategory) {
          throw new GraphQLError("Activity subcategory not found");
        }

        const updatedSubCategories = await db
          .update(activitySubcategories)
          .set({
            name: args.name,
          })
          .where(eq(activitySubcategories.id, args.id))
          .returning();
        const updatedSubCategory = updatedSubCategories[0];

        if (!updatedSubCategory) {
          throw new GraphQLError("Failed to update activity subcategory");
        }

        await addEvent({
          type: "updateActivitySubCategory",
          payload: {
            id: args.id,
            name: args.name,
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
            .where(eq(activitySubcategories.id, args.id))
            .limit(1)
        )[0];
        if (!subCategory) {
          throw new GraphQLError("Activity subcategory not found");
        }

        await db.delete(activitySubcategories).where(eq(activitySubcategories.id, args.id));

        await addEvent({
          type: "deleteActivitySubCategory",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return { id: args.id, success: true };
      },
    }),
  );
};
