import { asc, eq } from "drizzle-orm";

import { db } from "@/database";
import { views } from "@/tables";

import { builder } from "../builder";
import { ViewSchema } from "./schemas";

export const registerViewsQueries = () => {
  builder.queryField("views", (t) =>
    t.field({
      type: [ViewSchema],
      resolve: async (root, args, ctx) => {
        const viewsQuery = await db
          .select()
          .from(views)
          .where(eq(views.user, ctx.user.id))
          .orderBy(asc(views.createdAt));

        return viewsQuery;
      },
    }),
  );
};
