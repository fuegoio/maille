import type { Account } from "@maille/core/accounts";
import { builder } from "../builder";

export const AccountSchema = builder.objectRef<Account>("Account");

AccountSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    type: t.exposeString("type"),
    default: t.exposeBoolean("default"),
    startingBalance: t.exposeFloat("startingBalance", { nullable: true }),
    startingCashBalance: t.exposeFloat("startingCashBalance", {
      nullable: true,
    }),
    movements: t.exposeBoolean("movements"),
  }),
});
