import { db } from "@/database";
import { builder } from "../builder";
import { UserSchema } from "./schemas";
import { users } from "@/tables";

export const registerUsersQueries = () => {
  builder.queryField("users", (t) =>
    t.field({
      type: [UserSchema],
      resolve: async () => {
        return await db.select().from(users);
      },
    }),
  );
};
