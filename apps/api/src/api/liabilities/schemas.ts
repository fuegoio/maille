import { builder } from "@/api/builder";
import type { Liability } from "@maille/core/liabilities";

export const LiabilitySchema = builder.objectRef<Liability>("Liability");

LiabilitySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    amount: t.exposeFloat("amount"),
    activity: t.field({
      type: "UUID",
      resolve: (parent) => parent.activity,
      nullable: true,
    }),
    account: t.field({
      type: "UUID",
      resolve: (parent) => parent.account,
    }),
    name: t.exposeString("name"),
    date: t.field({
      type: "Date",
      resolve: (parent) => parent.date.toDate(),
    }),
    other: t.field({
      type: "String",
      resolve: (parent) => parent.other,
      nullable: true,
    }),
    other_user: t.field({
      type: "UUID",
      resolve: (parent) => parent.other_user,
      nullable: true,
    }),
  }),
});
