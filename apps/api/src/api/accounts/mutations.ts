import { AccountType } from "@maille/core/accounts";
import { builder } from "../builder";
import { AccountSchema, DeleteAccountResponseSchema } from "./schemas";
import { db } from "@/database";
import { accounts, accountsSharing, user as userTable, contacts } from "@/tables";
import { addEvent } from "../events";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { randomUUID } from "crypto";

export const registerAccountsMutations = () => {
  builder.mutationField("createAccount", (t) =>
    t.field({
      type: AccountSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg.string(),
        type: t.arg.string(),
        startingBalance: t.arg({
          type: "Float",
          required: false,
        }),
        startingCashBalance: t.arg({
          type: "Float",
          required: false,
        }),
        movements: t.arg({
          type: "Boolean",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const AccountTypeEnum = z.enum(AccountType);
        const accountType = AccountTypeEnum.parse(args.type);

        const account = (
          await db
            .insert(accounts)
            .values({
              id: args.id,
              name: args.name,
              startingBalance: args.startingBalance || undefined,
              startingCashBalance: args.movements
                ? args.startingCashBalance || undefined
                : undefined,
              movements: args.movements || false,
              type: accountType,
              user: ctx.user.id,
            })
            .returning()
        )[0];
        if (!account) {
          throw new GraphQLError("Failed to create account");
        }

        await addEvent({
          type: "createAccount",
          payload: {
            ...account,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return account;
      },
    }),
  );

  builder.mutationField("updateAccount", (t) =>
    t.field({
      type: AccountSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg({
          type: "String",
          required: false,
        }),
        startingBalance: t.arg({
          type: "Float",
          required: false,
        }),
        startingCashBalance: t.arg({
          type: "Float",
          required: false,
        }),
        movements: t.arg({
          type: "Boolean",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const account = (
          await db
            .select()
            .from(accounts)
            .where(and(eq(accounts.id, args.id), eq(accounts.user, ctx.user.id)))
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        const accountUpdates: Partial<typeof account> = {};
        if (args.name) {
          accountUpdates.name = args.name;
        }
        if (args.startingBalance !== undefined) {
          accountUpdates.startingBalance = args.startingBalance ?? undefined;
        }
        if (args.startingCashBalance !== undefined) {
          accountUpdates.startingCashBalance = args.startingCashBalance ?? undefined;
        }
        if (args.movements !== undefined) {
          accountUpdates.movements = args.movements ?? undefined;
        }

        const updatedAccounts = await db
          .update(accounts)
          .set(accountUpdates)
          .where(eq(accounts.id, args.id))
          .returning();
        const updatedAccount = updatedAccounts[0];

        if (!updatedAccount) {
          throw new GraphQLError("Failed to update account");
        }

        await addEvent({
          type: "updateAccount",
          payload: {
            id: args.id,
            ...accountUpdates,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedAccount;
      },
    }),
  );

  builder.mutationField("deleteAccount", (t) =>
    t.field({
      type: DeleteAccountResponseSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const account = (
          await db
            .select()
            .from(accounts)
            .where(and(eq(accounts.id, args.id), eq(accounts.user, ctx.user.id)))
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        await db.delete(accounts).where(eq(accounts.id, args.id));

        await addEvent({
          type: "deleteAccount",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          id: args.id,
          success: true,
        };
      },
    }),
  );

  builder.mutationField("shareAccount", (t) =>
    t.field({
      type: AccountSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        userId: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        // 1. Verify the account exists and belongs to the current user
        const originalAccount = (
          await db
            .select()
            .from(accounts)
            .where(and(eq(accounts.id, args.id), eq(accounts.user, ctx.user.id)))
        )[0];
        if (!originalAccount) {
          throw new GraphQLError("Account not found or doesn't belong to you");
        }

        // 2. Verify the contact exists and belongs to the current user
        const contact = (
          await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.contact, args.userId), eq(contacts.user, ctx.user.id)))
        )[0];
        if (!contact) {
          throw new GraphQLError("Contact not found or doesn't belong to you");
        }

        // 3. Verify the contact user exists
        const contactUser = (
          await db.select().from(userTable).where(eq(userTable.id, contact.contact))
        )[0];
        if (!contactUser) {
          throw new GraphQLError("Contact user not found");
        }

        // 4. Create a new account (duplicate) for the contact user
        const sharedAccountId = randomUUID();
        const sharedAccount = (
          await db
            .insert(accounts)
            .values({
              id: sharedAccountId,
              name: originalAccount.name,
              startingBalance: originalAccount.startingBalance,
              startingCashBalance: originalAccount.startingCashBalance,
              movements: originalAccount.movements,
              type: originalAccount.type,
              user: contactUser.id, // This account belongs to the contact user
              default: false,
            })
            .returning()
        )[0];

        if (!sharedAccount) {
          throw new GraphQLError("Failed to create shared account");
        }

        // 5. Create sharing records
        const sharingId = randomUUID();

        // Primary sharing record (original user)
        await db.insert(accountsSharing).values({
          id: randomUUID(),
          sharingId: sharingId,
          role: "primary",
          account: originalAccount.id,
          user: ctx.user.id,
        });

        // Secondary sharing record (contact user)
        await db.insert(accountsSharing).values({
          id: randomUUID(),
          sharingId: sharingId,
          role: "secondary",
          account: sharedAccount.id,
          user: contactUser.id,
        });

        // 6. Add events
        await addEvent({
          type: "updateAccount",
          payload: {
            id: originalAccount.id,
            sharing: [
              {
                id: sharingId,
                role: "primary",
                sharedWith: contactUser.id,
              },
            ],
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        await addEvent({
          type: "createAccount",
          payload: {
            ...sharedAccount,
            sharing: [
              {
                id: sharingId,
                role: "secondary",
                sharedWith: ctx.user.id,
              },
            ],
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: contactUser.id,
        });

        // 7. Return the original account with updated sharing info
        return {
          ...originalAccount,
          sharing: [
            {
              id: sharingId,
              role: "primary" as const,
              sharedWith: contactUser.id,
            },
          ],
        };
      },
    }),
  );
};
