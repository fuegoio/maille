import { builder } from "@/api/builder";
import { UserSchema } from "../users/schemas";
import type { User } from "@maille/core/users";

export const WorkspaceSchema = builder.objectRef<
  Workspace & {
    users: User[];
  }
>("Workspace");

WorkspaceSchema.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    startingDate: t.exposeString("startingDate", { nullable: true }),
    currency: t.exposeString("currency"),
    createdAt: t.exposeString("createdAt"),
    users: t.field({
      type: [UserSchema],
      resolve: (p) => p.users,
    }),
  }),
});

export interface Workspace {
  id: string;
  name: string;
  startingDate: string | null;
  currency: string;
  createdAt: string;
  users?: Array<User>;
}

