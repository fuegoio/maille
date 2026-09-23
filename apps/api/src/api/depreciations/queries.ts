import { eq } from "drizzle-orm";

import { db } from "@/database";
import { assetDepreciations } from "@/tables";
import { builder } from "../builder";
import { AssetDepreciationSchema } from "./schemas";

export const registerDepreciationsQueries = () => {
  builder.queryField("assetDepreciations", (t) =>
    t.field({
      type: [AssetDepreciationSchema],
      resolve: async (root, args, ctx) => {
        return await db
          .select()
          .from(assetDepreciations)
          .where(eq(assetDepreciations.user, ctx.user.id));
      },
    }),
  );
};
