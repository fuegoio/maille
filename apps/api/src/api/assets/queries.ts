import { db } from "@/database";
import { builder } from "../builder";
import { AssetSchema, AssetValuationSchema } from "./schemas";
import { assetValuations, assets } from "@/tables";
import { eq } from "drizzle-orm";

export const registerAssetsQueries = () => {
  builder.queryField("assets", (t) =>
    t.field({
      type: [AssetSchema],
      resolve: async (root, args, ctx) => {
        const assetsData = await db.select().from(assets).where(eq(assets.user, ctx.user.id));

        return assetsData;
      },
    }),
  );

  builder.queryField("assetValuations", (t) =>
    t.field({
      type: [AssetValuationSchema],
      resolve: async (root, args, ctx) => {
        return db.select().from(assetValuations).where(eq(assetValuations.user, ctx.user.id));
      },
    }),
  );
};
