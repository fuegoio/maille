import type { Investment, InvestmentPrice } from "@maille/core/accounts";
import { builder } from "../builder";

export const InvestmentSchema = builder.objectRef<Investment>("Investment");

InvestmentSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    account: t.exposeString("account"),
    name: t.exposeString("name"),
    symbol: t.exposeString("symbol", { nullable: true }),
    description: t.exposeString("description", { nullable: true }),
    initialQuantity: t.exposeFloat("initialQuantity"),
  }),
});

export const InvestmentPriceSchema = builder.objectRef<InvestmentPrice>("InvestmentPrice");

InvestmentPriceSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    investment: t.exposeString("investment"),
    date: t.field({
      type: "Date",
      resolve: (parent) => parent.date,
    }),
    price: t.exposeFloat("price"),
  }),
});
