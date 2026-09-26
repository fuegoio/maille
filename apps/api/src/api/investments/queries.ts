import { db } from "@/database";
import { builder } from "../builder";
import { InvestmentPriceSchema, InvestmentSchema } from "./schemas";
import { investmentPrices, investments } from "@/tables";
import { eq } from "drizzle-orm";

export const registerInvestmentsQueries = () => {
  builder.queryField("investments", (t) =>
    t.field({
      type: [InvestmentSchema],
      resolve: async (root, args, ctx) => {
        return db.select().from(investments).where(eq(investments.user, ctx.user.id));
      },
    }),
  );

  builder.queryField("investmentPrices", (t) =>
    t.field({
      type: [InvestmentPriceSchema],
      resolve: async (root, args, ctx) => {
        return db.select().from(investmentPrices).where(eq(investmentPrices.user, ctx.user.id));
      },
    }),
  );
};
