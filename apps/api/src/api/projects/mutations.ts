import { db } from "@/database";
import { builder } from "../builder";
import { ProjectSchema } from "./schemas";
import { activities, projects } from "@/tables";
import { addEvent } from "../events";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import dayjs from "dayjs";

export const registerProjectsMutations = () => {
  builder.mutationField("createProject", (t) =>
    t.field({
      type: ProjectSchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg.string(),
        emoji: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const project = (
          await db
            .insert(projects)
            .values({
              id: args.id,
              user: ctx.user,
              name: args.name,
              emoji: args.emoji,
            })
            .returning()
        )[0];

        await addEvent({
          type: "createProject",
          payload: {
            id: args.id,
            name: args.name,
            emoji: args.emoji ?? null,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return { ...project, startDate: null, endDate: null };
      },
    }),
  );

  builder.mutationField("updateProject", (t) =>
    t.field({
      type: ProjectSchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg.string({ required: false }),
        emoji: t.arg.string({ required: false }),
        startDate: t.arg({
          type: "Date",
          required: false,
        }),
        endDate: t.arg({
          type: "Date",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const project = (
          await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, args.id), eq(projects.user, ctx.user)))
        )[0];
        if (!project) {
          throw new GraphQLError("Project not found");
        }

        const updates: Partial<typeof project> = {};
        if (args.name) {
          updates.name = args.name;
        }

        // Optional fields
        if (args.emoji !== undefined) {
          updates.emoji = args.emoji;
        }
        if (args.startDate !== undefined) {
          updates.startDate = args.startDate;
          if (args.startDate === null) updates.endDate = null;
        }
        if (args.endDate !== undefined) {
          updates.endDate = args.endDate;
        }

        const updatedProject = (
          await db
            .update(projects)
            .set(updates)
            .where(and(eq(projects.id, args.id), eq(projects.user, ctx.user)))
            .returning()
        )[0];

        await addEvent({
          type: "updateProject",
          payload: {
            id: args.id,
            ...updates,
            startDate:
              updates.startDate === null
                ? null
                : updates.startDate?.toISOString(),
            endDate:
              updates.endDate === null ? null : updates.endDate?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          ...updatedProject,
          startDate: updatedProject.startDate
            ? dayjs(updatedProject.startDate)
            : null,
          endDate: updatedProject.endDate
            ? dayjs(updatedProject.endDate)
            : null,
        };
      },
    }),
  );

  builder.mutationField("deleteProject", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({
          type: "UUID",
        }),
      },
      resolve: async (root, args, ctx) => {
        const project = (
          await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, args.id), eq(projects.user, ctx.user)))
        )[0];
        if (!project) {
          throw new GraphQLError("Project not found");
        }

        await db
          .update(activities)
          .set({ project: null })
          .where(
            and(eq(activities.project, args.id), eq(activities.user, ctx.user)),
          );

        await db
          .delete(projects)
          .where(and(eq(projects.id, args.id), eq(projects.user, ctx.user)));

        await addEvent({
          type: "deleteProject",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return true;
      },
    }),
  );
};
