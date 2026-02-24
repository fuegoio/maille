import { builder } from "../builder";
import { ContactSchema } from "./schemas";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { contacts, user as userTable } from "@/tables";

export const registerContactsQueries = () => {
  builder.queryField("contacts", (t) =>
    t.field({
      type: [ContactSchema],
      resolve: async (root, args, ctx) => {
        const contactsQuery = await db
          .select()
          .from(contacts)
          .where(eq(contacts.user, ctx.user.id));

        // Transform database results to match the Contact type with full user data
        const result = await Promise.all(
          contactsQuery.map(async (contact) => {
            // Fetch the user data for each contact
            const userData = await db
              .select()
              .from(userTable)
              .where(eq(userTable.id, contact.contact))
              .limit(1);

            const user = userData[0];

            if (!user) {
              throw new Error(`User not found for contact ID: ${contact.contact}`);
            }

            return {
              id: contact.id,
              contact: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image || "",
              },
              createdAt: contact.createdAt,
            };
          }),
        );

        return result;
      },
    }),
  );
};
