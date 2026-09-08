import { builder } from "@/api/builder";
import { db } from "@/database";
import type { Fund, FundAccount, FundMove } from "@maille/core/funds";
import { fundAccounts } from "@/tables";
import { and, eq } from "drizzle-orm";

export const FundAccountSchema = builder.objectRef<FundAccount>("FundAccount");

FundAccountSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    fund: t.exposeString("fund"),
    account: t.exposeString("account"),
    amount: t.exposeFloat("amount"),
  }),
});

export const FundSchema = builder.objectRef<Fund>("Fund");

FundSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    color: t.exposeString("color"),
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
    parentFund: t.field({
      type: "String",
      resolve: (parent) => parent.parentFund,
      nullable: true,
    }),
    accounts: t.field({
      type: [FundAccountSchema],
      resolve: async (parent, _args, ctx) => {
        if (parent.accounts) return parent.accounts;
        const rows = await db
          .select()
          .from(fundAccounts)
          .where(and(eq(fundAccounts.fund, parent.id), eq(fundAccounts.user, ctx.user.id)));
        return rows;
      },
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
    // The database column is NOT NULL; the core type keeps null for
    // UI-staged legs that have no transaction yet.
    transaction: t.field({
      type: "String",
      resolve: (parent) => parent.transaction as string,
    }),
  }),
});
