import { builder } from "@/api/builder";
import { UserSchema } from "../users/schemas";
import type { User } from "@maille/core/users";
import type { Workspace } from "@maille/core/workspaces";

export const WorkspaceSchema = builder.objectRef<
  Workspace & {
    users: User[];
  }
>("Workspace");

WorkspaceSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    startingDate: t.field({
      type: "Date",
      resolve: (p) => p.startingDate,
    }),
    currency: t.exposeString("currency"),
    createdAt: t.exposeString("createdAt"),
    users: t.field({
      type: [UserSchema],
      resolve: (p) => p.users,
    }),
  }),
});
