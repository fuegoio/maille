import { db } from "@/database";
import { builder } from "../builder";
import { ProjectSchema } from "./schemas";
import { activities, projects } from "@/tables";
import { addEvent } from "../events";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

export const registerProjectsMutations = () => {
  builder.mutationField("createProject", (t) =>
    t.field({
      type: ProjectSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg.string(),
        emoji: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const projectResults = await db
          .insert(projects)
          .values({
            id: args.id,
            user: ctx.user.id,
            name: args.name,
            emoji: args.emoji,
          })
          .returning();
        const project = projectResults[0];

        if (!project) {
          throw new GraphQLError("Failed to create project");
        }

        await addEvent({
          type: "createProject",
          payload: {
            id: args.id,
            name: args.name,
            emoji: args.emoji ?? null,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
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
          type: "String",
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
            .where(and(eq(projects.id, args.id), eq(projects.user, ctx.user.id)))
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

        const updatedProjects = await db
          .update(projects)
          .set(updates)
          .where(eq(projects.id, args.id))
          .returning();
        const updatedProject = updatedProjects[0];

        if (!updatedProject) {
          throw new GraphQLError("Failed to update project");
        }

        await addEvent({
          type: "updateProject",
          payload: {
            id: args.id,
            ...updates,
            startDate: updates.startDate === null ? null : updates.startDate?.toISOString(),
            endDate: updates.endDate === null ? null : updates.endDate?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          ...updatedProject,
          startDate: updatedProject.startDate,
          endDate: updatedProject.endDate,
        };
      },
    }),
  );

  builder.mutationField("deleteProject", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const project = (
          await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, args.id), eq(projects.user, ctx.user.id)))
        )[0];
        if (!project) {
          throw new GraphQLError("Project not found");
        }

        await db.update(activities).set({ project: null }).where(eq(activities.project, args.id));
        await db.delete(projects).where(eq(projects.id, args.id));

        await addEvent({
          type: "deleteProject",
          payload: {
            id: args.id,
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
