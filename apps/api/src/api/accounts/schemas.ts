import type { Account } from "@maille/core/accounts";
import { builder } from "../builder";
import type { UUID } from "crypto";

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
    user: t.field({
      type: "UUID",
      nullable: true,
      resolve: (parent) => parent.user,
    }),
    workspace: t.field({
      type: "UUID",
      nullable: true,
      resolve: (parent) => parent.workspace,
    }),
  }),
});

export const DeleteAccountResponseSchema = builder.objectRef<{
  id: UUID;
  success: boolean;
}>("DeleteAccountResponse");

DeleteAccountResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});
