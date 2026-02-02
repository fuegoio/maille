import { AccountType } from "@maille/core/accounts";
import { builder } from "../builder";
import { AccountSchema, DeleteAccountResponseSchema } from "./schemas";
import { db } from "@/database";
import { accounts, movements, transactions } from "@/tables";
import { addEvent } from "../events";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

export const registerAccountsMutations = () => {
  builder.mutationField("createAccount", (t) =>
    t.field({
      type: AccountSchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg.string(),
        type: t.arg.string(),
        workspace: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const AccountTypeEnum = z.nativeEnum(AccountType);
        const accountType = AccountTypeEnum.parse(args.type);

        await db.insert(accounts).values({
          id: args.id,
          name: args.name,
          type: accountType,
          user: ctx.user,
          workspace: args.workspace,
        });

        await addEvent({
          type: "createAccount",
          payload: {
            id: args.id,
            name: args.name,
            type: accountType,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          id: args.id,
          name: args.name,
          user: ctx.user,
          workspace: args.workspace ?? null,
          type: accountType,
          default: false,
          startingBalance: null,
          startingCashBalance: null,
          movements: false,
        };
      },
    }),
  );

  builder.mutationField("updateAccount", (t) =>
    t.field({
      type: AccountSchema,
      args: {
        id: t.arg({
          type: "UUID",
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
          await db.select().from(accounts).where(eq(accounts.id, args.id))
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        const accountUpdates: Partial<typeof account> = {};
        if (args.startingBalance !== undefined) {
          accountUpdates.startingBalance = args.startingBalance ?? undefined;
        }
        if (args.startingCashBalance !== undefined) {
          accountUpdates.startingCashBalance =
            args.startingCashBalance ?? undefined;
        }
        if (args.movements !== undefined) {
          accountUpdates.movements = args.movements ?? undefined;
        }

        const updatedAccount = (
          await db
            .update(accounts)
            .set(accountUpdates)
            .where(eq(accounts.id, args.id))
            .returning()
        )[0];

        await addEvent({
          type: "updateAccount",
          payload: {
            id: args.id,
            ...accountUpdates,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
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
          type: "UUID",
        }),
      },
      resolve: async (root, args, ctx) => {
        const account = (
          await db.select().from(accounts).where(eq(accounts.id, args.id))
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        await db
          .delete(transactions)
          .where(eq(transactions.toAccount, args.id));
        await db
          .delete(transactions)
          .where(eq(transactions.fromAccount, args.id));
        await db.delete(movements).where(eq(movements.account, args.id));
        await db.delete(accounts).where(eq(accounts.id, args.id));

        await addEvent({
          type: "deleteAccount",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          id: args.id,
          success: true,
        };
      },
    }),
  );
};
