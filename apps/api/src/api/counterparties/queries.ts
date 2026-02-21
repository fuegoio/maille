import { builder } from "../builder";
import { CounterpartySchema } from "./schemas";
import { and, eq } from "drizzle-orm";
import { db } from "@/database";
import { validateWorkspace } from "@/services/workspaces";
import { accounts, counterparties } from "@/tables";

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
          .innerJoin(accounts, eq(accounts.id, counterparties.account))
          .where(
            and(eq(counterparties.workspace, args.workspaceId), eq(accounts.user, ctx.user.id)),
          );

        return counterpartiesQuery.map((counterparty) => counterparty.counterparties);
      },
    }),
  );
};
