import { db } from "@/database";
import { builder } from "../builder";
import { FundSchema } from "./schemas";
import { funds, fundAccounts } from "@/tables";
import { eq } from "drizzle-orm";

export const registerFundsQueries = () => {
  builder.queryField("funds", (t) =>
    t.field({
      type: [FundSchema],
      resolve: async (root, args, ctx) => {
        const [fundRows, accountRows] = await Promise.all([
          db.select().from(funds).where(eq(funds.user, ctx.user.id)),
          db.select().from(fundAccounts).where(eq(fundAccounts.user, ctx.user.id)),
        ]);

        const accountsByFund = new Map<string, typeof accountRows>();
        for (const row of accountRows) {
          const list = accountsByFund.get(row.fund) ?? [];
          list.push(row);
          accountsByFund.set(row.fund, list);
        }

        return fundRows.map((fund) => ({
          ...fund,
          accounts: accountsByFund.get(fund.id) ?? [],
        }));
      },
    }),
  );
};
