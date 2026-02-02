import { builder } from "@/api/builder";

export const WorkspaceSchema = builder.objectRef<Workspace>("Workspace");

WorkspaceSchema.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    startingDate: t.exposeString("startingDate", { nullable: true }),
    currency: t.exposeString("currency"),
    createdAt: t.exposeString("createdAt"),
  }),
});

export interface Workspace {
  id: string;
  name: string;
  startingDate: string | null;
  currency: string;
  createdAt: string;
}