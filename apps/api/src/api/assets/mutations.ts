import { builder } from "../builder";
import { AssetSchema, DeleteAssetResponseSchema } from "./schemas";
import { db } from "@/database";
import { accounts, assets, transactions } from "@/tables";
import { addEvent } from "../events";
import { and, eq } from "drizzle-orm";
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
            .where(and(eq(accounts.id, args.account), eq(accounts.user, ctx.user.id)))
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
            .where(and(eq(assets.id, args.id), eq(accounts.user, ctx.user.id)))
        )[0]?.assets;
        if (!asset) {
          throw new GraphQLError("Asset not found");
        }

        const assetUpdates: Partial<typeof asset> = {};
        if (args.account) {
          assetUpdates.account = args.account;
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
          .where(eq(assets.id, args.id))
          .returning();
        const updatedAsset = updatedAssets[0];

        if (!updatedAsset) {
          throw new GraphQLError("Failed to update asset");
        }

        await addEvent({
          type: "updateAsset",
          payload: {
            id: args.id,
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
            .where(and(eq(assets.id, args.id), eq(accounts.user, ctx.user.id)))
        )[0]?.assets;
        if (!asset) {
          throw new GraphQLError("Asset not found");
        }

        await db.delete(assets).where(eq(assets.id, args.id));
        await db
          .update(transactions)
          .set({ fromAsset: null })
          .where(eq(transactions.fromAsset, args.id));
        await db
          .update(transactions)
          .set({ toAsset: null })
          .where(eq(transactions.toAsset, args.id));

        await addEvent({
          type: "deleteAsset",
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
