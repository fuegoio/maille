import { builder } from "../builder";
import { db } from "@/database";
import { users } from "@/tables";
import { addEvent } from "../events";
import { eq } from "drizzle-orm";
import { CreateUserSchema, UserSchema } from "./schemas";
import { createUser } from "../auth";
import { bootstrapUser } from "@/services/users";

export const registerUsersMutations = () => {
  builder.mutationField("createUser", (t) =>
    t.field({
      type: CreateUserSchema,
      args: {
        firstName: t.arg.string(),
        lastName: t.arg.string(),
        email: t.arg.string(),
        password: t.arg.string(),
      },
      resolve: async (root, args, ctx) => {
        const user = await createUser(
          args.email,
          args.password,
          args.firstName,
          args.lastName,
        );

        const { accounts } = await bootstrapUser(user.id);
        await addEvent({
          type: "createUser",
          payload: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            accounts,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: null,
          accounts,
        };
      },
    }),
  );

  builder.mutationField("updateUser", (t) =>
    t.field({
      type: UserSchema,
      args: {
        firstName: t.arg.string({ required: false }),
        lastName: t.arg.string({ required: false }),
        avatar: t.arg.string({ required: false }),
      },
      resolve: async (root, args, ctx) => {
        const userUpdates: {
          firstName?: string;
          lastName?: string;
          avatar?: string;
        } = {};
        if (args.firstName) {
          userUpdates.firstName = args.firstName;
        }
        if (args.lastName) {
          userUpdates.lastName = args.lastName;
        }
        if (args.avatar) {
          userUpdates.avatar = args.avatar;
        }

        const updatedUser = (
          await db
            .update(users)
            .set(userUpdates)
            .where(eq(users.id, ctx.user))
            .returning()
        )[0];

        await addEvent({
          type: "updateUser",
          payload: {
            id: ctx.user,
            ...userUpdates,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          ...updatedUser,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
        };
      },
    }),
  );
};
