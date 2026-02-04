import { db } from "@/database";
import { builder } from "../builder";
import { AccountSchema } from "./schemas";
import { accounts } from "@/tables";
import { eq, and } from "drizzle-orm";
import { validateWorkspace } from "@/services/workspaces";

export const registerAccountsQueries = () => {
  builder.queryField("accounts", (t) =>
    t.field({
      type: [AccountSchema],
      args: {
        workspaceId: t.arg({ type: "UUID", required: true }),
      },
      resolve: async (root, args, ctx) => {
        await validateWorkspace(args.workspaceId, ctx.user.id);

        return await db
          .select()
          .from(accounts)
          .where(and(eq(accounts.user, ctx.user.id), eq(accounts.workspace, args.workspaceId)));
      },
    }),
  );
};
