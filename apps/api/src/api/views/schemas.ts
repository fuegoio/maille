import { builder } from "@/api/builder";

/** A view as the API returns it: config stays a JSON string. */
export type ViewRow = {
  id: string;
  name: string;
  scope: string;
  resource: string;
  config: string;
  createdAt: Date;
};

export const ViewSchema = builder.objectRef<ViewRow>("View");

ViewSchema.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    scope: t.exposeString("scope"),
    resource: t.exposeString("resource"),
    config: t.exposeString("config"),
    createdAt: t.field({
      type: "Date",
      resolve: (parent) => parent.createdAt,
    }),
  }),
});
