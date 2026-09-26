import { builder } from "../builder";
import { AssetSchema, AssetValuationSchema, DeleteAssetResponseSchema } from "./schemas";
import { db } from "@/database";
import { accounts, assetValuations, assetDepreciations, assets, transactions } from "@/tables";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "../events";
import { deleteAssetDepreciation } from "@/services/depreciations";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";

/** The asset, scoped to the user, resolved from its possibly-prefixed id. */
const getUserAsset = async (assetId: string, userId: string) => {
  const asset = (
    await db
      .select()
      .from(assets)
      .innerJoin(accounts, eq(accounts.id, assets.account))
      .where(and(like(assets.id, idPattern(assetId)), eq(accounts.user, userId)))
  )[0]?.assets;
  if (!asset) {
    throw new GraphQLError("Asset not found");
  }
  return asset;
};

export const registerAssetsMutations = () => {
  builder.mutationField("createAsset", (t) =>
    t.field({
      type: AssetSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        account: t.arg.string(),
        name: t.arg.string(),
        description: t.arg({
          type: "String",
          required: false,
        }),
        location: t.arg({
          type: "String",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const account = (
          await db
            .select()
            .from(accounts)
            .where(and(like(accounts.id, idPattern(args.account)), eq(accounts.user, ctx.user.id)))
            .limit(1)
        )[0];
        if (!account) {
          throw new GraphQLError("Account not found");
        }

        const asset = (
          await db
            .insert(assets)
            .values({
              id: args.id,
              user: ctx.user.id,
              account: account.id,
              name: args.name,
              description: args.description || undefined,
              location: args.location || undefined,
            })
            .returning()
        )[0];
        if (!asset) {
          throw new GraphQLError("Failed to create asset");
        }

        await addEvent({
          type: "createAsset",
          payload: {
            ...asset,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return asset;
      },
    }),
  );

  builder.mutationField("updateAsset", (t) =>
    t.field({
      type: AssetSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        account: t.arg({
          type: "String",
          required: false,
        }),
        name: t.arg({
          type: "String",
          required: false,
        }),
        description: t.arg({
          type: "String",
          required: false,
        }),
        location: t.arg({
          type: "String",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const asset = (
          await db
            .select()
            .from(assets)
            .innerJoin(accounts, eq(accounts.id, assets.account))
            .where(and(like(assets.id, idPattern(args.id)), eq(accounts.user, ctx.user.id)))
        )[0]?.assets;
        if (!asset) {
          throw new GraphQLError("Asset not found");
        }

        const assetUpdates: Partial<typeof asset> = {};
        if (args.account) {
          const account = (
            await db
              .select()
              .from(accounts)
              .where(
                and(like(accounts.id, idPattern(args.account)), eq(accounts.user, ctx.user.id)),
              )
              .limit(1)
          )[0];
          if (!account) {
            throw new GraphQLError("Account not found");
          }
          assetUpdates.account = account.id;
        }
        if (args.name) {
          assetUpdates.name = args.name;
        }
        if (args.description !== undefined) {
          assetUpdates.description = args.description;
        }
        if (args.location !== undefined) {
          assetUpdates.location = args.location;
        }

        const updatedAssets = await db
          .update(assets)
          .set(assetUpdates)
          .where(eq(assets.id, asset.id))
          .returning();
        const updatedAsset = updatedAssets[0];

        if (!updatedAsset) {
          throw new GraphQLError("Failed to update asset");
        }

        await addEvent({
          type: "updateAsset",
          payload: {
            id: asset.id,
            ...assetUpdates,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedAsset;
      },
    }),
  );

  builder.mutationField("deleteAsset", (t) =>
    t.field({
      type: DeleteAssetResponseSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const asset = (
          await db
            .select()
            .from(assets)
            .innerJoin(accounts, eq(accounts.id, assets.account))
            .where(and(like(assets.id, idPattern(args.id)), eq(accounts.user, ctx.user.id)))
        )[0]?.assets;
        if (!asset) {
          throw new GraphQLError("Asset not found");
        }

        // The asset's depreciation schedule goes with it: its future
        // generated activities are deleted, past ones become ordinary
        // ledger rows.
        const plan = (
          await db.select().from(assetDepreciations).where(eq(assetDepreciations.asset, asset.id))
        )[0];
        if (plan) {
          await deleteAssetDepreciation(ctx.user.id, ctx.session.id, plan.id);
        }

        await db.delete(assets).where(eq(assets.id, asset.id));
        await db
          .update(transactions)
          .set({ fromAsset: null })
          .where(eq(transactions.fromAsset, asset.id));
        await db
          .update(transactions)
          .set({ toAsset: null })
          .where(eq(transactions.toAsset, asset.id));

        await addEvent({
          type: "deleteAsset",
          payload: {
            id: asset.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          id: asset.id,
          success: true,
        };
      },
    }),
  );

  builder.mutationField("addAssetValuation", (t) =>
    t.field({
      type: AssetValuationSchema,
      args: {
        id: t.arg({ type: "String" }),
        asset: t.arg({ type: "String" }),
        date: t.arg({ type: "Date" }),
        value: t.arg.float(),
      },
      resolve: async (root, args, ctx) => {
        const asset = await getUserAsset(args.asset, ctx.user.id);

        // One valuation per day: adding one for a day that already has
        // it replaces the day's row.
        const existing = (
          await db
            .select()
            .from(assetValuations)
            .where(and(eq(assetValuations.asset, asset.id), eq(assetValuations.date, args.date)))
            .limit(1)
        )[0];

        const valuation = existing
          ? (
              await db
                .update(assetValuations)
                .set({ value: args.value })
                .where(eq(assetValuations.id, existing.id))
                .returning()
            )[0]
          : (
              await db
                .insert(assetValuations)
                .values({
                  id: args.id,
                  user: ctx.user.id,
                  asset: asset.id,
                  date: args.date,
                  value: args.value,
                })
                .returning()
            )[0];
        if (!valuation) {
          throw new GraphQLError("Failed to save asset valuation");
        }

        await addEvent({
          type: "addAssetValuation",
          payload: {
            id: valuation.id,
            asset: valuation.asset,
            date: valuation.date.toISOString(),
            value: valuation.value,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return valuation;
      },
    }),
  );

  builder.mutationField("updateAssetValuation", (t) =>
    t.field({
      type: AssetValuationSchema,
      args: {
        id: t.arg({ type: "String" }),
        date: t.arg({ type: "Date", required: false }),
        value: t.arg.float({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const valuation = (
          await db
            .select()
            .from(assetValuations)
            .where(
              and(
                like(assetValuations.id, idPattern(args.id)),
                eq(assetValuations.user, ctx.user.id),
              ),
            )
        )[0];
        if (!valuation) {
          throw new GraphQLError("Asset valuation not found");
        }

        const updates: Partial<typeof valuation> = {};
        if (args.date != null) {
          updates.date = args.date;
        }
        if (args.value != null) {
          updates.value = args.value;
        }

        const updatedValuation = (
          await db
            .update(assetValuations)
            .set(updates)
            .where(eq(assetValuations.id, valuation.id))
            .returning()
        )[0];
        if (!updatedValuation) {
          throw new GraphQLError("Failed to update asset valuation");
        }

        await addEvent({
          type: "updateAssetValuation",
          payload: {
            id: valuation.id,
            asset: valuation.asset,
            ...(updatedValuation.date !== valuation.date
              ? { date: updatedValuation.date.toISOString() }
              : {}),
            ...(updates.value !== undefined ? { value: updatedValuation.value } : {}),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedValuation;
      },
    }),
  );

  builder.mutationField("deleteAssetValuation", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({ type: "String" }),
      },
      resolve: async (root, args, ctx) => {
        const valuation = (
          await db
            .select()
            .from(assetValuations)
            .where(
              and(
                like(assetValuations.id, idPattern(args.id)),
                eq(assetValuations.user, ctx.user.id),
              ),
            )
        )[0];
        if (!valuation) {
          throw new GraphQLError("Asset valuation not found");
        }

        await db.delete(assetValuations).where(eq(assetValuations.id, valuation.id));

        await addEvent({
          type: "deleteAssetValuation",
          payload: {
            id: valuation.id,
            asset: valuation.asset,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return true;
      },
    }),
  );
};
