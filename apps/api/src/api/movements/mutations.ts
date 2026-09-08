import { builder } from "../builder";
import {
  MovementSchema,
  DeleteMovementResponseSchema,
  MovementActivitySchema,
  DeleteMovementActivityResponseSchema,
} from "./schemas";
import { accounts, activities, movements, movementsActivities } from "@/tables";
import { db } from "@/database";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "@/api/events";
import { computeHistory, emitHistoryEvents } from "@/api/history/history";
import { loadHistoryLabels } from "@/api/history/labels";
import {
  buildCreateEntry,
  buildLinkEntry,
  buildUnlinkEntry,
  buildUpdateLinkEntry,
  diffMovement,
} from "@maille/core/history";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { ensureWorkflow, cancelWorkflowIfActive } from "@/harness/store";
import { isHarnessConfigured } from "@/harness/config";
import { enqueueWorkflow } from "@/harness/queue";
import { isHarnessSession } from "@/harness/session";

export const registerMovementsMutations = () => {
  builder.mutationField("createMovement", (t) =>
    t.field({
      type: MovementSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg.string(),
        date: t.arg({ type: "Date" }),
        amount: t.arg.float(),
        account: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const account = (
          await db
            .select({ id: accounts.id })
            .from(accounts)
            .where(and(like(accounts.id, idPattern(args.account)), eq(accounts.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        const { history, emitted } = computeHistory(
          ctx,
          [],
          [buildCreateEntry("movement", args.id)],
        );

        await db.insert(movements).values({
          id: args.id,
          user: ctx.user.id,
          name: args.name,
          date: new Date(args.date),
          amount: args.amount,
          account: account.id,
          history,
        });

        await addEvent({
          type: "createMovement",
          payload: {
            id: args.id,
            name: args.name,
            date: args.date.toISOString(),
            amount: args.amount,
            account: account.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });
        await emitHistoryEvents(ctx, emitted);

        // AI harness: auto-trigger the movement's unique workflow when the
        // harness is configured. Insert-only (one workflow per movement).
        if (isHarnessConfigured()) {
          const workflow = await ensureWorkflow(ctx.user.id, args.id, "auto", ctx.session.id);
          if (workflow) {
            enqueueWorkflow(workflow.id, workflow.user);
          }
        }

        return {
          id: args.id,
          user: ctx.user.id,
          name: args.name,
          date: args.date,
          amount: args.amount,
          account: account.id,
          activities: [],
          status: "incomplete" as "incomplete" | "completed",
          history,
        };
      },
    }),
  );

  builder.mutationField("updateMovement", (t) =>
    t.field({
      type: MovementSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        date: t.arg({
          type: "Date",
          required: false,
        }),
        amount: t.arg({
          type: "Float",
          required: false,
        }),
        name: t.arg({
          type: "String",
          required: false,
        }),
        account: t.arg({
          type: "String",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const movement = (
          await db
            .select()
            .from(movements)
            .where(and(like(movements.id, idPattern(args.id)), eq(movements.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!movement) {
          throw new GraphQLError("Movement not found");
        }

        const updates: Partial<typeof movement> = {};
        if (args.date) {
          updates.date = args.date;
        }
        if (args.amount) {
          updates.amount = args.amount;
        }
        if (args.name) {
          updates.name = args.name;
        }
        if (args.account) {
          const account = (
            await db
              .select({ id: accounts.id })
              .from(accounts)
              .where(
                and(like(accounts.id, idPattern(args.account)), eq(accounts.user, ctx.user.id)),
              )
              .limit(1)
          )[0];
          if (!account) {
            throw new GraphQLError("Account not found");
          }
          updates.account = account.id;
        }

        // History: derive the diff from the before/after rows.
        const labels = await loadHistoryLabels(ctx.user.id);
        const after = { ...movement, ...updates };
        const changes = diffMovement(
          {
            name: movement.name,
            date: movement.date.toISOString(),
            amount: movement.amount,
            account: { id: movement.account, label: labels.account(movement.account) },
          },
          {
            name: after.name,
            date: after.date.toISOString(),
            amount: after.amount,
            account: { id: after.account, label: labels.account(after.account) },
          },
        );
        const historyResult =
          changes.length > 0
            ? computeHistory(ctx, movement.history, [
                {
                  entityType: "movement",
                  entityId: movement.id,
                  action: "update",
                  changes,
                },
              ])
            : null;

        const updatedMovements = await db
          .update(movements)
          .set({
            ...updates,
            ...(historyResult ? { history: historyResult.history } : {}),
          })
          .where(eq(movements.id, movement.id))
          .returning();
        const updatedMovement = updatedMovements[0];

        if (!updatedMovement) {
          throw new GraphQLError("Failed to update movement");
        }

        await addEvent({
          type: "updateMovement",
          payload: {
            id: movement.id,
            ...updates,
            date: updates.date?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });
        if (historyResult) {
          await emitHistoryEvents(ctx, historyResult.emitted);
        }

        const activitiesData = await db
          .select()
          .from(movementsActivities)
          .where(eq(movementsActivities.movement, movement.id));

        return {
          ...updatedMovement,
          date: updatedMovement.date,
          activities: activitiesData,
          status: (activitiesData.reduce((sum, ma) => sum + ma.amount, 0) === movement.amount
            ? "completed"
            : "incomplete") as "incomplete" | "completed",
        };
      },
    }),
  );

  builder.mutationField("deleteMovement", (t) =>
    t.field({
      type: DeleteMovementResponseSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const movement = (
          await db
            .select()
            .from(movements)
            .where(and(like(movements.id, idPattern(args.id)), eq(movements.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!movement) {
          throw new GraphQLError("Movement not found");
        }

        // History: unlink entries on the activities this movement was linked to.
        const linkedActivities = await db
          .select({
            linkAmount: movementsActivities.amount,
            activity: activities,
          })
          .from(movementsActivities)
          .innerJoin(activities, eq(movementsActivities.activity, activities.id))
          .where(eq(movementsActivities.movement, movement.id));

        for (const { linkAmount, activity } of linkedActivities) {
          const { history, emitted } = computeHistory(ctx, activity.history, [
            buildUnlinkEntry(
              "activity",
              activity.id,
              {
                type: "movement",
                id: movement.id,
                label: movement.name,
              },
              linkAmount,
            ),
          ]);
          await db.update(activities).set({ history }).where(eq(activities.id, activity.id));
          await emitHistoryEvents(ctx, emitted);
        }

        await db.delete(movements).where(eq(movements.id, movement.id));

        await addEvent({
          type: "deleteMovement",
          payload: {
            id: movement.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          id: movement.id,
          success: true,
        };
      },
    }),
  );

  builder.mutationField("createMovementActivity", (t) =>
    t.field({
      type: MovementActivitySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        movementId: t.arg({
          type: "String",
        }),
        activityId: t.arg({
          type: "String",
        }),
        amount: t.arg.float(),
      },
      resolve: async (root, args, ctx) => {
        const movement = (
          await db
            .select()
            .from(movements)
            .where(
              and(like(movements.id, idPattern(args.movementId)), eq(movements.user, ctx.user.id)),
            )
            .limit(1)
        )[0];
        if (!movement) {
          throw new GraphQLError("Movement not found");
        }

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

        const insertedMovementActivities = await db
          .insert(movementsActivities)
          .values({
            id: args.id,
            movement: movement.id,
            activity: activity.id,
            amount: args.amount,
          })
          .onConflictDoNothing()
          .returning();
        const movementActivity = insertedMovementActivities[0];

        if (!movementActivity) {
          // Retry of an already-applied mutation — nothing changed, no history.
          return {
            id: args.id,
            movement: movement.id,
            activity: activity.id,
            amount: args.amount,
          };
        }

        // History: link entry on both timelines.
        const movementHistory = computeHistory(ctx, movement.history, [
          buildLinkEntry(
            "movement",
            movement.id,
            {
              type: "activity",
              id: activity.id,
              label: activity.name,
            },
            args.amount,
          ),
        ]);
        const activityHistory = computeHistory(ctx, activity.history, [
          buildLinkEntry(
            "activity",
            activity.id,
            {
              type: "movement",
              id: movement.id,
              label: movement.name,
            },
            args.amount,
          ),
        ]);

        await db
          .update(movements)
          .set({ history: movementHistory.history })
          .where(eq(movements.id, movement.id));
        await db
          .update(activities)
          .set({ history: activityHistory.history })
          .where(eq(activities.id, activity.id));

        await addEvent({
          type: "createMovementActivity",
          payload: {
            id: movementActivity.id,
            movement: movement.id,
            activity: activity.id,
            amount: args.amount,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });
        await emitHistoryEvents(ctx, movementHistory.emitted);
        await emitHistoryEvents(ctx, activityHistory.emitted);

        // AI harness: a manual link by the user cancels the movement's
        // active workflow — the assistant never fights the user. Links made
        // by the harness itself (machine session) do not.
        if (!isHarnessSession(ctx.session.id)) {
          await cancelWorkflowIfActive(ctx.user.id, movement.id, ctx.session.id);
        }

        return movementActivity;
      },
    }),
  );

  builder.mutationField("updateMovementActivity", (t) =>
    t.field({
      type: MovementActivitySchema,
      args: {
        id: t.arg({
          type: "String",
          required: true,
        }),
        amount: t.arg.float(),
      },
      resolve: async (root, args, ctx) => {
        const movementActivity = (
          await db
            .select()
            .from(movementsActivities)
            .where(like(movementsActivities.id, idPattern(args.id)))
            .limit(1)
        )[0];
        if (!movementActivity) {
          throw new GraphQLError("MovementActivity not found");
        }

        const ownedMovement = (
          await db
            .select()
            .from(movements)
            .where(
              and(eq(movements.id, movementActivity.movement), eq(movements.user, ctx.user.id)),
            )
            .limit(1)
        )[0];
        if (!ownedMovement) {
          throw new GraphQLError("MovementActivity not found");
        }

        const linkedActivity = (
          await db
            .select()
            .from(activities)
            .where(eq(activities.id, movementActivity.activity))
            .limit(1)
        )[0];

        const updatedFields: Partial<typeof movementActivity> = {};
        if (args.amount !== undefined) updatedFields.amount = args.amount;

        const updatedMovementActivities = await db
          .update(movementsActivities)
          .set(updatedFields)
          .where(eq(movementsActivities.id, movementActivity.id))
          .returning();
        const updatedMovementActivity = updatedMovementActivities[0];

        if (!updatedMovementActivity) {
          throw new GraphQLError("Failed to update movement activity");
        }

        // History: amount change of the link, on both timelines.
        const historyResults = [];
        if (args.amount !== movementActivity.amount && linkedActivity) {
          const movementHistory = computeHistory(ctx, ownedMovement.history, [
            buildUpdateLinkEntry(
              "movement",
              ownedMovement.id,
              {
                type: "activity",
                id: linkedActivity.id,
                label: linkedActivity.name,
              },
              movementActivity.amount,
              args.amount,
            )!,
          ]);
          const activityHistory = computeHistory(ctx, linkedActivity.history, [
            buildUpdateLinkEntry(
              "activity",
              linkedActivity.id,
              {
                type: "movement",
                id: ownedMovement.id,
                label: ownedMovement.name,
              },
              movementActivity.amount,
              args.amount,
            )!,
          ]);

          await db
            .update(movements)
            .set({ history: movementHistory.history })
            .where(eq(movements.id, ownedMovement.id));
          await db
            .update(activities)
            .set({ history: activityHistory.history })
            .where(eq(activities.id, linkedActivity.id));

          historyResults.push(movementHistory, activityHistory);
        }

        await addEvent({
          type: "updateMovementActivity",
          payload: {
            id: movementActivity.id,
            activity: movementActivity.activity,
            movement: movementActivity.movement,
            amount: args.amount,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });
        for (const result of historyResults) {
          await emitHistoryEvents(ctx, result.emitted);
        }

        return updatedMovementActivity;
      },
    }),
  );

  builder.mutationField("deleteMovementActivity", (t) =>
    t.field({
      type: DeleteMovementActivityResponseSchema,
      args: {
        id: t.arg({
          type: "String",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const movementActivity = (
          await db
            .select()
            .from(movementsActivities)
            .where(like(movementsActivities.id, idPattern(args.id)))
            .limit(1)
        )[0];
        if (!movementActivity) {
          throw new GraphQLError("MovementActivity not found");
        }

        const ownedMovement = (
          await db
            .select()
            .from(movements)
            .where(
              and(eq(movements.id, movementActivity.movement), eq(movements.user, ctx.user.id)),
            )
            .limit(1)
        )[0];
        if (!ownedMovement) {
          throw new GraphQLError("MovementActivity not found");
        }

        const linkedActivity = (
          await db
            .select()
            .from(activities)
            .where(eq(activities.id, movementActivity.activity))
            .limit(1)
        )[0];

        await db.delete(movementsActivities).where(eq(movementsActivities.id, movementActivity.id));

        // History: unlink entry on both timelines.
        if (linkedActivity) {
          const movementHistory = computeHistory(ctx, ownedMovement.history, [
            buildUnlinkEntry(
              "movement",
              ownedMovement.id,
              {
                type: "activity",
                id: linkedActivity.id,
                label: linkedActivity.name,
              },
              movementActivity.amount,
            ),
          ]);
          const activityHistory = computeHistory(ctx, linkedActivity.history, [
            buildUnlinkEntry(
              "activity",
              linkedActivity.id,
              {
                type: "movement",
                id: ownedMovement.id,
                label: ownedMovement.name,
              },
              movementActivity.amount,
            ),
          ]);

          await db
            .update(movements)
            .set({ history: movementHistory.history })
            .where(eq(movements.id, ownedMovement.id));
          await db
            .update(activities)
            .set({ history: activityHistory.history })
            .where(eq(activities.id, linkedActivity.id));

          await emitHistoryEvents(ctx, movementHistory.emitted);
          await emitHistoryEvents(ctx, activityHistory.emitted);
        }

        await addEvent({
          type: "deleteMovementActivity",
          payload: {
            id: movementActivity.id,
            activity: movementActivity.activity,
            movement: movementActivity.movement,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return { id: movementActivity.id, success: true };
      },
    }),
  );
};
