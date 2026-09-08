import { db } from "@/database";
import { builder } from "../builder";
import { FundSchema, FundAllocationSchema } from "./schemas";
import { funds, fundAllocations } from "@/tables";
import { eq } from "drizzle-orm";

export const registerFundsQueries = () => {
  builder.queryField("funds", (t) =>
    t.field({
      type: [FundSchema],
      resolve: async (root, args, ctx) => {
        return await db.select().from(funds).where(eq(funds.user, ctx.user.id));
      },
    }),
  );

  // Every opening allocation: fund legs are read through their transaction.
  builder.queryField("fundAllocations", (t) =>
    t.field({
      type: [FundAllocationSchema],
      resolve: async (root, args, ctx) => {
        return await db.select().from(fundAllocations).where(eq(fundAllocations.user, ctx.user.id));
      },
    }),
  );
};
