import { db } from "@/database";
import { builder } from "../builder";
import { AssetSchema } from "./schemas";
import { assets } from "@/tables";
import { eq } from "drizzle-orm";
import { validateWorkspace } from "@/services/workspaces";

export const registerAssetsQueries = () => {
  builder.queryField("assets", (t) =>
    t.field({
      type: [AssetSchema],
      args: {
        workspaceId: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args, ctx) => {
        await validateWorkspace(args.workspaceId, ctx.user.id);

        return await db
          .select()
          .from(assets)
          .where(eq(assets.workspace, args.workspaceId));
      },
    }),
  );
};