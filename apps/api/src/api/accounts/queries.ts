import { db } from "@/database";
import { builder } from "../builder";
import { AccountSchema } from "./schemas";
import { accounts } from "@/tables";

export const registerAccountsQueries = () => {
  builder.queryField("accounts", (t) =>
    t.field({
      type: [AccountSchema],
      resolve: async () => {
        return await db.select().from(accounts);
      },
    }),
  );
};
