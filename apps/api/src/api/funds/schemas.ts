import { builder } from "@/api/builder";
import type { Fund, FundMove } from "@maille/core/funds";

export const FundSchema = builder.objectRef<Fund>("Fund");

FundSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    color: t.exposeString("color"),
    isDefault: t.exposeBoolean("isDefault"),
    startDate: t.field({
      type: "Date",
      resolve: (parent) => parent.startDate,
      nullable: true,
    }),
    endDate: t.field({
      type: "Date",
      resolve: (parent) => parent.endDate,
      nullable: true,
    }),
  }),
});

export const FundMoveSchema = builder.objectRef<FundMove>("FundMove");

FundMoveSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    fromFund: t.field({
      type: "String",
      resolve: (parent) => parent.fromFund,
      nullable: true,
    }),
    toFund: t.field({
      type: "String",
      resolve: (parent) => parent.toFund,
      nullable: true,
    }),
    amount: t.exposeFloat("amount"),
    date: t.field({
      type: "Date",
      resolve: (parent) => parent.date,
    }),
    note: t.exposeString("note", { nullable: true }),
    transaction: t.field({
      type: "String",
      resolve: (parent) => parent.transaction,
      nullable: true,
    }),
  }),
});
