import { builder } from "@/api/builder";
import type { Project } from "@maille/core/projects";

export const ProjectSchema = builder.objectRef<Project>("Project");

ProjectSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    emoji: t.exposeString("emoji", { nullable: true }),
    startDate: t.field({
      type: "Date",
      resolve: (parent) => {
        return parent.startDate;
      },
      nullable: true,
    }),
    endDate: t.field({
      type: "Date",
      resolve: (parent) => {
        return parent.endDate;
      },
      nullable: true,
    }),
  }),
});
