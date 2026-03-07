import { builder } from "../builder";
import {
  MovementSchema,
  DeleteMovementResponseSchema,
  MovementActivitySchema,
  DeleteMovementActivityResponseSchema,
} from "./schemas";
import { accounts, activities, movements, movementsActivities } from "@/tables";
import { db } from "@/database";
import { addEvent } from "@/api/events";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";

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
            .where(and(like(accounts.id, `${args.account}%`), eq(accounts.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        await db.insert(movements).values({
          id: args.id,
          user: ctx.user.id,
          name: args.name,
          date: new Date(args.date),
          amount: args.amount,
          account: account.id,
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

        return {
          id: args.id,
          user: ctx.user.id,
          name: args.name,
          date: args.date,
          amount: args.amount,
          account: account.id,
          activities: [],
          status: "incomplete" as "incomplete" | "completed",
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
            .where(and(like(movements.id, `${args.id}%`), eq(movements.user, ctx.user.id)))
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
              .where(and(like(accounts.id, `${args.account}%`), eq(accounts.user, ctx.user.id)))
              .limit(1)
          )[0];
          if (!account) {
            throw new GraphQLError("Account not found");
          }
          updates.account = account.id;
        }

        const updatedMovements = await db
          .update(movements)
          .set(updates)
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
            .where(and(like(movements.id, `${args.id}%`), eq(movements.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!movement) {
          throw new GraphQLError("Movement not found");
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
            .select({ id: movements.id })
            .from(movements)
            .where(and(like(movements.id, `${args.movementId}%`), eq(movements.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!movement) {
          throw new GraphQLError("Movement not found");
        }

        const activity = (
          await db
            .select({ id: activities.id })
            .from(activities)
            .where(and(like(activities.id, `${args.activityId}%`), eq(activities.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        await db.insert(movementsActivities).values({
          id: args.id,
          movement: movement.id,
          activity: activity.id,
          amount: args.amount,
        });

        await addEvent({
          type: "createMovementActivity",
          payload: {
            id: args.id,
            movement: movement.id,
            activity: activity.id,
            amount: args.amount,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          id: args.id,
          movement: movement.id,
          activity: activity.id,
          amount: args.amount,
        };
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
            .where(like(movementsActivities.id, `${args.id}%`))
            .limit(1)
        )[0];
        if (!movementActivity) {
          throw new GraphQLError("MovementActivity not found");
        }

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
            .where(like(movementsActivities.id, `${args.id}%`))
            .limit(1)
        )[0];
        if (!movementActivity) {
          throw new GraphQLError("MovementActivity not found");
        }
        await db.delete(movementsActivities).where(eq(movementsActivities.id, movementActivity.id));

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
