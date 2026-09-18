import type { ViewResource } from "@maille/core/views";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { addEvent } from "../events";
import { idPattern } from "../idPrefix";
import { db } from "@/database";
import { views } from "@/tables";

import { builder } from "../builder";
import { ViewSchema } from "./schemas";

const VIEW_RESOURCES: ViewResource[] = ["activities", "movements", "transactions"];

export const registerViewsMutations = () => {
  builder.mutationField("createView", (t) =>
    t.field({
      type: ViewSchema,
      args: {
        id: t.arg({ type: "String" }),
        name: t.arg.string(),
        scope: t.arg.string(),
        resource: t.arg.string(),
        config: t.arg.string(),
      },
      resolve: async (root, args, ctx) => {
        if (!VIEW_RESOURCES.includes(args.resource as ViewResource)) {
          throw new GraphQLError("View resource not valid");
        }

        const createdViews = await db
          .insert(views)
          .values({
            id: args.id,
            user: ctx.user.id,
            name: args.name,
            scope: args.scope,
            resource: args.resource as ViewResource,
            config: args.config,
          })
          .returning();
        const view = createdViews[0];

        if (!view) {
          throw new GraphQLError("Failed to create view");
        }

        await addEvent({
          type: "createView",
          payload: {
            id: view.id,
            name: view.name,
            scope: view.scope,
            resource: view.resource,
            config: view.config,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return view;
      },
    }),
  );

  builder.mutationField("updateView", (t) =>
    t.field({
      type: ViewSchema,
      args: {
        id: t.arg({ type: "String" }),
        name: t.arg.string({ required: false }),
        config: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const view = (
          await db
            .select()
            .from(views)
            .where(and(like(views.id, idPattern(args.id)), eq(views.user, ctx.user.id)))
        )[0];
        if (!view) {
          throw new GraphQLError("View not found");
        }

        const updates: { name?: string; config?: string } = {};
        if (args.name !== null) {
          updates.name = args.name;
        }
        if (args.config !== null) {
          updates.config = args.config;
        }

        const updatedViews = await db
          .update(views)
          .set(updates)
          .where(eq(views.id, view.id))
          .returning();
        const updatedView = updatedViews[0];

        if (!updatedView) {
          throw new GraphQLError("Failed to update view");
        }

        await addEvent({
          type: "updateView",
          payload: {
            id: view.id,
            ...updates,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedView;
      },
    }),
  );

  builder.mutationField("deleteView", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({ type: "String" }),
      },
      resolve: async (root, args, ctx) => {
        const view = (
          await db
            .select()
            .from(views)
            .where(and(like(views.id, idPattern(args.id)), eq(views.user, ctx.user.id)))
        )[0];
        if (!view) {
          throw new GraphQLError("View not found");
        }

        await db.delete(views).where(eq(views.id, view.id));

        await addEvent({
          type: "deleteView",
          payload: {
            id: view.id,
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
