import { builder } from "../builder";
import { AssetDepreciationSchema, DeleteAssetDepreciationResponseSchema } from "./schemas";
import {
  createAssetDepreciation,
  deleteAssetDepreciation,
  updateAssetDepreciation,
} from "@/services/depreciations";

export const registerDepreciationsMutations = () => {
  builder.mutationField("createAssetDepreciation", (t) =>
    t.field({
      type: AssetDepreciationSchema,
      args: {
        id: t.arg({ type: "String" }),
        asset: t.arg({ type: "String" }),
        method: t.arg({ type: "String" }),
        basis: t.arg({ type: "Float" }),
        months: t.arg({ type: "Int" }),
        startMonth: t.arg({ type: "Date" }),
        expenseAccount: t.arg({ type: "String" }),
        category: t.arg({ type: "String", required: false }),
        subcategory: t.arg({ type: "String", required: false }),
      },
      resolve: (root, args, ctx) =>
        createAssetDepreciation(ctx.user.id, ctx.session.id, {
          ...args,
          method: args.method === "linear" ? "linear" : undefined!,
        }),
    }),
  );

  builder.mutationField("updateAssetDepreciation", (t) =>
    t.field({
      type: AssetDepreciationSchema,
      args: {
        id: t.arg({ type: "String" }),
        basis: t.arg({ type: "Float", required: false }),
        months: t.arg({ type: "Int", required: false }),
        startMonth: t.arg({ type: "Date", required: false }),
        expenseAccount: t.arg({ type: "String", required: false }),
        category: t.arg({ type: "String", required: false }),
        subcategory: t.arg({ type: "String", required: false }),
      },
      resolve: (root, args, ctx) =>
        updateAssetDepreciation(ctx.user.id, ctx.session.id, {
          id: args.id,
          basis: args.basis ?? undefined,
          months: args.months ?? undefined,
          startMonth: args.startMonth ?? undefined,
          expenseAccount: args.expenseAccount ?? undefined,
          category: args.category === null ? null : args.category,
          subcategory: args.subcategory === null ? null : args.subcategory,
        }),
    }),
  );

  builder.mutationField("deleteAssetDepreciation", (t) =>
    t.field({
      type: DeleteAssetDepreciationResponseSchema,
      args: {
        id: t.arg({ type: "String" }),
      },
      resolve: (root, args, ctx) => deleteAssetDepreciation(ctx.user.id, ctx.session.id, args.id),
    }),
  );
};
