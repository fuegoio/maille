import { db } from "@/database";
import { builder } from "../builder";
import { AccountSchema } from "./schemas";
import { accounts } from "@/tables";
import { eq, and } from "drizzle-orm";

export const registerAccountsQueries = () => {
  builder.queryField("accounts", (t) =>
    t.field({
      type: [AccountSchema],
      args: {
        workspaceId: t.arg({ type: "UUID", required: false }),
      },
      resolve: async (root, args, ctx) => {
        return await db
          .select()
          .from(accounts)
          .where(
            and(
              eq(accounts.user, ctx.user),
              args.workspaceId ? eq(accounts.workspace, args.workspaceId) : undefined,
            ),
          );
      },
    }),
  );
};
