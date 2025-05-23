import { projects } from "@/tables";
import { builder } from "../builder";
import { ProjectSchema } from "./schemas";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import dayjs from "dayjs";

export const registerProjectsQueries = () => {
  builder.queryField("projects", (t) =>
    t.field({
      type: [ProjectSchema],
      resolve: async () => {
        const projectsQuery = await db.select().from(projects);

        return projectsQuery.map((project) => ({
          ...project,
          startDate: project.startDate ? dayjs(project.startDate) : null,
          endDate: project.endDate ? dayjs(project.endDate) : null,
        }));
      },
    }),
  );
};
