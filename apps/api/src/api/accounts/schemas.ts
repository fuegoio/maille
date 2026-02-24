import type { Account } from "@maille/core/accounts";
import { builder } from "../builder";

export const AccountSchema = builder.objectRef<Account>("Account");

AccountSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
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

export const DeleteAccountResponseSchema = builder.objectRef<{
  id: string;
  success: boolean;
}>("DeleteAccountResponse");

DeleteAccountResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});
