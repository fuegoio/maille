import { db } from "@/database";
import { builder } from "../builder";
import { AccountSchema } from "./schemas";
import { accounts } from "@/tables";
import { eq } from "drizzle-orm";

export const registerAccountsQueries = () => {
  builder.queryField("accounts", (t) =>
    t.field({
      type: [AccountSchema],
      resolve: async (root, args, ctx) => {
        return await db.select().from(accounts).where(eq(accounts.user, ctx.user));
      },
    }),
  );
};
