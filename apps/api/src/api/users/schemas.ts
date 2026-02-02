import { builder, type TypesWithDefaults } from "../builder";
import type { User } from "@maille/core/users";
import type { ObjectRef } from "@pothos/core";

const addBaseUserImplementation = (ref: ObjectRef<TypesWithDefaults, User>) =>
  builder.objectFields(ref, (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    email: t.exposeString("email"),
    name: t.exposeString("name"),
    image: t.exposeString("image", { nullable: true }),
  }));

export const UserSchema = builder.objectRef<User>("User").implement({});

addBaseUserImplementation(UserSchema);
