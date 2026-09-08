import { db } from "@/database";
import { movementWorkflows } from "@/tables";
import { builder } from "../builder";
import { MovementWorkflowSchema } from "./schemas";
import { serializeWorkflow } from "@/workflows/store";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { WorkflowStatus } from "@maille/core/workflows";

export const registerWorkflowsQueries = () => {
  builder.queryField("workflows", (t) =>
    t.field({
      type: [MovementWorkflowSchema],
      args: {
        statuses: t.arg({ type: ["String"], required: false }),
      },
      resolve: async (root, args, ctx) => {
        const statuses = (args.statuses ?? undefined) as WorkflowStatus[] | undefined;

        const rows = await db
          .select()
          .from(movementWorkflows)
          .where(
            statuses?.length
              ? and(
                  eq(movementWorkflows.user, ctx.user.id),
                  inArray(movementWorkflows.status, statuses),
                )
              : eq(movementWorkflows.user, ctx.user.id),
          )
          .orderBy(desc(movementWorkflows.updatedAt));

        return rows.map(serializeWorkflow);
      },
    }),
  );
};
