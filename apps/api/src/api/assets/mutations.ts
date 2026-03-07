import { builder } from "../builder";
import { AssetSchema, DeleteAssetResponseSchema } from "./schemas";
import { db } from "@/database";
import { accounts, assets, transactions } from "@/tables";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "../events";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";

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
};
