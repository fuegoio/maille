import { builder } from "../builder";
import { CounterpartySchema } from "./schemas";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { validateWorkspace } from "@/services/workspaces";
import { counterparties } from "@/tables";

export const registerCounterpartiesQueries = () => {
  builder.queryField("counterparties", (t) =>
    t.field({
      type: [CounterpartySchema],
      args: {
        workspaceId: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args, ctx) => {
        await validateWorkspace(args.workspaceId, ctx.user.id);

        const counterpartiesQuery = await db
          .select()
          .from(counterparties)
          .where(eq(counterparties.workspace, args.workspaceId));

        return counterpartiesQuery.map((counterparty) => ({
          ...counterparty,
        }));
      },
    }),
  );
};

