import { builder } from "../builder";
import {
  MovementSchema,
  DeleteMovementResponseSchema,
  MovementActivitySchema,
  DeleteMovementActivityResponseSchema,
} from "./schemas";
import { movements, movementsActivities } from "@/tables";
import { db } from "@/database";
import { addEvent } from "@/api/events";
import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { validateWorkspace } from "@/services/workspaces";

export const registerMovementsMutations = () => {
  builder.mutationField("createMovement", (t) =>
    t.field({
      type: MovementSchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg.string(),
        date: t.arg({ type: "Date" }),
        amount: t.arg.float(),
        account: t.arg({
          type: "UUID",
        }),
        workspace: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspace, ctx.user);

        await db.insert(movements).values({
          id: args.id,
          user: ctx.user,
          workspace: args.workspace,
          name: args.name,
          date: new Date(args.date),
          amount: args.amount,
          account: args.account,
        });

        await addEvent({
          type: "createMovement",
          payload: {
            id: args.id,
            name: args.name,
            date: args.date.toISOString(),
            amount: args.amount,
            account: args.account,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          id: args.id,
          user: ctx.user,
          workspace: args.workspace ?? null,
          name: args.name,
          date: dayjs(args.date),
          amount: args.amount,
          account: args.account,
          activities: [],
          status: "incomplete" as "incomplete" | "completed",
        };
      },
    })
  );

  builder.mutationField("updateMovement", (t) =>
    t.field({
      type: MovementSchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        date: t.arg({
          type: "Date",
          required: false,
        }),
        amount: t.arg({
          type: "Float",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const movement = (
          await db
            .select()
            .from(movements)
            .where(and(eq(movements.id, args.id), eq(movements.user, ctx.user)))
            .limit(1)
        )[0];
        if (!movement) {
          throw new GraphQLError("Movement not found");
        }

        // Validate workspace from the movement
        if (movement.workspace) {
          await validateWorkspace(movement.workspace, ctx.user);
        }

        const updates: Partial<typeof movement> = {};
        if (args.date) {
          updates.date = args.date;
        }
        if (args.amount) {
          updates.amount = args.amount;
        }

        const updatedMovement = (
          await db
            .update(movements)
            .set(updates)
            .where(eq(movements.id, args.id))
            .returning()
        )[0];

        await addEvent({
          type: "updateMovement",
          payload: {
            id: args.id,
            ...updates,
            date: updates.date?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        const activitiesData = await db
          .select()
          .from(movementsActivities)
          .where(eq(movementsActivities.movement, args.id));

        return {
          ...updatedMovement,
          date: dayjs(updatedMovement.date),
          activities: activitiesData,
          status: (activitiesData.reduce((sum, ma) => sum + ma.amount, 0) ===
          movement.amount
            ? "completed"
            : "incomplete") as "incomplete" | "completed",
        };
      },
    })
  );

  builder.mutationField("deleteMovement", (t) =>
    t.field({
      type: DeleteMovementResponseSchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
      },
      resolve: async (root, args, ctx) => {
        const movement = (
          await db
            .select()
            .from(movements)
            .where(and(eq(movements.id, args.id), eq(movements.user, ctx.user)))
            .limit(1)
        )[0];
        if (!movement) {
          throw new GraphQLError("Movement not found");
        }

        // Validate workspace from the movement
        if (movement.workspace) {
          await validateWorkspace(movement.workspace, ctx.user);
        }

        await db
          .delete(movementsActivities)
          .where(eq(movementsActivities.movement, args.id));
        await db.delete(movements).where(eq(movements.id, args.id));

        await addEvent({
          type: "deleteMovement",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          id: args.id,
          success: true,
        };
      },
    })
  );

  builder.mutationField("createMovementActivity", (t) =>
    t.field({
      type: MovementActivitySchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        movementId: t.arg({
          type: "UUID",
        }),
        activityId: t.arg({
          type: "UUID",
        }),
        amount: t.arg.float(),
        workspace: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspace, ctx.user);

        await db.insert(movementsActivities).values({
          id: args.id,
          user: ctx.user,
          workspace: args.workspace,
          movement: args.movementId,
          activity: args.activityId,
          amount: args.amount,
        });

        await addEvent({
          type: "createMovementActivity",
          payload: {
            id: args.id,
            movement: args.movementId,
            activity: args.activityId,
            amount: args.amount,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          id: args.id,
          workspace: args.workspace ?? null,
          movement: args.movementId,
          activity: args.activityId,
          amount: args.amount,
        };
      },
    })
  );

  builder.mutationField("updateMovementActivity", (t) =>
    t.field({
      type: MovementActivitySchema,
      args: {
        id: t.arg({
          type: "UUID",
          required: true,
        }),
        amount: t.arg.float(),
      },
      resolve: async (root, args, ctx) => {
        const movementActivity = (
          await db
            .select()
            .from(movementsActivities)
            .where(eq(movementsActivities.id, args.id))
            .limit(1)
        )[0];
        if (!movementActivity) {
          throw new GraphQLError("MovementActivity not found");
        }

        // Validate workspace from the movement activity
        if (movementActivity.workspace) {
          await validateWorkspace(movementActivity.workspace, ctx.user);
        }

        const updatedFields: Partial<typeof movementActivity> = {};
        if (args.amount !== undefined) updatedFields.amount = args.amount;

        const updatedMovementActivity = (
          await db
            .update(movementsActivities)
            .set(updatedFields)
            .where(eq(movementsActivities.id, args.id))
            .returning()
        )[0];

        await addEvent({
          type: "updateMovementActivity",
          payload: {
            id: args.id,
            movement: movementActivity.movement,
            amount: args.amount,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return updatedMovementActivity;
      },
    })
  );

  builder.mutationField("deleteMovementActivity", (t) =>
    t.field({
      type: DeleteMovementActivityResponseSchema,
      args: {
        id: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const movementActivity = (
          await db
            .select()
            .from(movementsActivities)
            .where(eq(movementsActivities.id, args.id))
            .limit(1)
        )[0];
        if (!movementActivity) {
          throw new GraphQLError("MovementActivity not found");
        }

        // Validate workspace from the movement activity
        if (movementActivity.workspace) {
          await validateWorkspace(movementActivity.workspace, ctx.user);
        }

        await db
          .delete(movementsActivities)
          .where(eq(movementsActivities.id, args.id));

        await addEvent({
          type: "deleteMovementActivity",
          payload: {
            id: args.id,
            movement: movementActivity.movement,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return { id: args.id, success: true };
      },
    })
  );
};
