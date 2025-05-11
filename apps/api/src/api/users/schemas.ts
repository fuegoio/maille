import { builder } from "../builder";
import type { User } from "@maille/core/users";

export const UserSchema = builder.objectRef<User>("User");

UserSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    email: t.exposeString("email"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    avatar: t.exposeString("avatar", { nullable: true }),
  }),
});
