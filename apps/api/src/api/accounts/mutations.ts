import { AccountType } from "@maille/core/accounts";
import { builder } from "../builder";
import { AccountSchema, DeleteAccountResponseSchema } from "./schemas";
import { db } from "@/database";
import { accounts, movements, transactions } from "@/tables";
import { addEvent } from "../events";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

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

        await db.delete(transactions).where(eq(transactions.toAccount, args.id));
        await db.delete(transactions).where(eq(transactions.fromAccount, args.id));
        await db.delete(movements).where(eq(movements.account, args.id));
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
};
