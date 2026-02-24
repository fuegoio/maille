import { db } from "@/database";
import { builder } from "../builder";
import { AssetSchema } from "./schemas";
import { assets } from "@/tables";
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
};
