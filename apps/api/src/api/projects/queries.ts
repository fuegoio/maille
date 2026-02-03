import { projects } from "@/tables";
import { builder } from "../builder";
import { ProjectSchema } from "./schemas";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { validateWorkspace } from "@/services/workspaces";

export const registerProjectsQueries = () => {
  builder.queryField("projects", (t) =>
    t.field({
      type: [ProjectSchema],
      args: {
        workspaceId: t.arg({ type: "UUID", required: true }),
      },
      resolve: async (root, args, ctx) => {
        await validateWorkspace(args.workspaceId, ctx.user.id);

        const projectsQuery = await db
          .select()
          .from(projects)
          .where(eq(projects.workspace, args.workspaceId));

        return projectsQuery.map((project) => ({
          ...project,
          startDate: project.startDate,
          endDate: project.endDate,
        }));
      },
    }),
  );
};
