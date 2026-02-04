import { db } from "@/database";
import { builder } from "../builder";
import { MovementSchema } from "./schemas";
import { movements, movementsActivities } from "@/tables";
import { eq, and } from "drizzle-orm";
import type { Movement } from "@maille/core/movements";
import { validateWorkspace } from "@/services/workspaces";

export const registerMovementsQueries = () => {
  builder.queryField("movements", (t) =>
    t.field({
      type: [MovementSchema],
      args: {
        workspaceId: t.arg({ type: "UUID", required: true }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspaceId, ctx.user.id);

        const movementsData = await db
          .select()
          .from(movements)
          .where(and(eq(movements.user, ctx.user.id), eq(movements.workspace, args.workspaceId)))
          .leftJoin(movementsActivities, eq(movements.id, movementsActivities.movement));

        return movementsData
          .reduce<Omit<Movement, "status">[]>((acc, row) => {
            let movement = acc.find((a) => a.id === row.movements.id);
            if (!movement) {
              movement = {
                ...row.movements,
                date: row.movements.date,
                activities: [],
              };
              acc.push(movement);
            }

            if (row.movements_activities) {
              movement.activities.push(row.movements_activities);
            }

            return acc;
          }, [])
          .map((movement) => ({
            ...movement,
            status: (movement.activities.reduce((sum, ma) => sum + ma.amount, 0) === movement.amount
              ? "completed"
              : "incomplete") as "incomplete" | "completed",
          }));
      },
    }),
  );
};
