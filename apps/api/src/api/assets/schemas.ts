import type { Asset, AssetValuation } from "@maille/core/accounts";
import { builder } from "../builder";

export const AssetSchema = builder.objectRef<Asset>("Asset");

AssetSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    account: t.field({
      type: "String",
      resolve: (parent) => parent.account,
    }),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    location: t.exposeString("location", { nullable: true }),
  }),
});

export const DeleteAssetResponseSchema = builder.objectRef<{
  id: string;
  success: boolean;
}>("DeleteAssetResponse");

DeleteAssetResponseSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    success: t.exposeBoolean("success"),
  }),
});

export const AssetValuationSchema = builder.objectRef<AssetValuation>("AssetValuation");

AssetValuationSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    asset: t.exposeString("asset"),
    date: t.field({
      type: "Date",
      resolve: (parent) => parent.date,
    }),
    value: t.exposeFloat("value"),
  }),
});
