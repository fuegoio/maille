import { projects } from "@/tables";
import { builder } from "../builder";
import { ProjectSchema } from "./schemas";
import { eq, and } from "drizzle-orm";
import { db } from "@/database";
import dayjs from "dayjs";

export const registerProjectsQueries = () => {
  builder.queryField("projects", (t) =>
    t.field({
      type: [ProjectSchema],
      args: {
        workspaceId: t.arg({ type: "UUID", required: false }),
      },
      resolve: async (root, args, ctx) => {
        const projectsQuery = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.user, ctx.user),
              args.workspaceId ? eq(projects.workspace, args.workspaceId) : undefined,
            ),
          );

        return projectsQuery.map((project) => ({
          ...project,
          startDate: project.startDate ? dayjs(project.startDate) : null,
          endDate: project.endDate ? dayjs(project.endDate) : null,
        }));
      },
    }),
  );
};
