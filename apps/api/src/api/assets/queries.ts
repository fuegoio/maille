import { db } from "@/database";
import { builder } from "../builder";
import { AssetSchema } from "./schemas";
import { accounts, assets } from "@/tables";
import { and, eq } from "drizzle-orm";
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

        const assetsData = await db
          .select()
          .from(assets)
          .innerJoin(accounts, eq(accounts.id, assets.account))
          .where(and(eq(assets.workspace, args.workspaceId), eq(accounts.user, ctx.user.id)));

        return assetsData.map((row) => row.assets);
      },
    }),
  );
};

