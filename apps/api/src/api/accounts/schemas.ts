import type { Account } from "@maille/core/accounts";
import { builder } from "../builder";
import { db } from "@/database";
import { accountsSharing } from "@/tables";
import { eq } from "drizzle-orm";

export const AccountSchema = builder.objectRef<Account>("Account");

export const AccountSharingSchema = builder.objectRef<{
  id: string;
  role: "primary" | "secondary";
  sharedWith?: string;
}>("AccountSharing");

AccountSharingSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    role: t.exposeString("role"),
    sharedWith: t.exposeString("sharedWith", { nullable: true }),
  }),
});

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
    sharing: t.field({
      type: [AccountSharingSchema],
      resolve: async (parent, args, ctx) => {
        const sharingRecords = await db
          .select()
          .from(accountsSharing)
          .where(eq(accountsSharing.account, parent.id));

        return sharingRecords.map((record) => ({
          id: record.sharingId,
          role: record.role,
          sharedWith: record.user,
        }));
      },
    }),
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
