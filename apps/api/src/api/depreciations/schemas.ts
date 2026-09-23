import type { AssetDepreciation } from "@maille/core/accounts";

import { builder } from "../builder";

export const AssetDepreciationSchema = builder.objectRef<AssetDepreciation>("AssetDepreciation");

AssetDepreciationSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    asset: t.field({
      type: "String",
      resolve: (parent) => parent.asset,
    }),
    method: t.field({
      type: "String",
      resolve: (parent) => parent.method,
    }),
    basis: t.exposeFloat("basis"),
    months: t.field({
      type: "Int",
      resolve: (parent) => parent.months,
    }),
    startMonth: t.field({
      type: "Date",
      resolve: (parent) => parent.startMonth,
    }),
    expenseAccount: t.field({
      type: "String",
      resolve: (parent) => parent.expenseAccount,
    }),
    category: t.field({
      type: "String",
      resolve: (parent) => parent.category,
      nullable: true,
    }),
    subcategory: t.field({
      type: "String",
      resolve: (parent) => parent.subcategory,
      nullable: true,
    }),
  }),
});

export const DeleteAssetDepreciationResponseSchema = builder.objectRef<{
  id: string;
  success: boolean;
}>("DeleteAssetDepreciationResponse");

DeleteAssetDepreciationResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});
