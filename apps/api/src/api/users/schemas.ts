import type { Account } from "@maille/core/accounts";
import { builder, type TypesWithDefaults } from "../builder";
import type { User } from "@maille/core/users";
import { AccountSchema } from "../accounts/schemas";
import type { ObjectRef } from "@pothos/core";

const addBaseUserImplementation = (ref: ObjectRef<TypesWithDefaults, User>) =>
  builder.objectFields(ref, (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    email: t.exposeString("email"),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    avatar: t.exposeString("avatar", { nullable: true }),
  }));

export const UserSchema = builder.objectRef<User>("User").implement({});

addBaseUserImplementation(UserSchema);

export const CreateUserSchema = builder
  .objectRef<
    User & {
      accounts: Account[];
    }
  >("CreateUser")
  .implement({});

addBaseUserImplementation(CreateUserSchema);
builder.objectFields(CreateUserSchema, (t) => ({
  accounts: t.field({
    type: [AccountSchema],
    resolve: (parent) => parent.accounts,
  }),
}));
