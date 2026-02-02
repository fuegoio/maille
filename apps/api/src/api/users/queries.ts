import { db } from "@/database";
import { builder } from "../builder";
import { UserSchema } from "./schemas";
import { users } from "@/tables";

export const registerUsersQueries = () => {
  builder.queryField("users", (t) =>
    t.field({
      type: [UserSchema],
      resolve: async () => {
        const usersList = await db.select().from(users);
        return usersList.map(user => ({
          ...user,
          firstName: user.first_name,
          lastName: user.last_name,
        }));
      },
    }),
  );
};
