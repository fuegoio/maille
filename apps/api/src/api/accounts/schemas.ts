import type { Account, AccountSharing } from "@maille/core/accounts";
import { builder } from "../builder";
import { db } from "@/database";
import { accountsSharing } from "@/tables";
import { eq } from "drizzle-orm";

export const AccountSchema = builder.objectRef<Omit<Account, "sharing">>("Account");

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
      resolve: async (parent) => {
        const sharingId = (
          await db.select().from(accountsSharing).where(eq(accountsSharing.account, parent.id))
        )[0]?.sharingId;

        const sharingRecords = sharingId
          ? await db.select().from(accountsSharing).where(eq(accountsSharing.sharingId, sharingId))
          : [];

        return sharingRecords.map((record) => ({
          role: record.role,
          sharedWith: record.user,
          proportion: record.proportion,
        }));
      },
    }),
  }),
});

export const AccountSharingSchema = builder.objectRef<AccountSharing>("AccountSharing");

AccountSharingSchema.implement({
  fields: (t) => ({
    role: t.exposeString("role"),
    sharedWith: t.exposeString("sharedWith", { nullable: true }),
    proportion: t.exposeFloat("proportion"),
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
