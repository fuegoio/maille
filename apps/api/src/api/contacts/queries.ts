import { db } from "@/database";
import { builder } from "../builder";
import { ContactSchema } from "./schemas";
import { contacts } from "@/tables";
import { eq } from "drizzle-orm";

export const registerContactsQueries = () => {
  builder.queryField("contacts", (t) =>
    t.field({
      type: [ContactSchema],
      resolve: async (root, args, ctx) => {
        const contactsData = await db
          .select()
          .from(contacts)
          .where(eq(contacts.user, ctx.user));

        return contactsData.map((contact) => ({
          id: contact.id,
          contact: contact.contact,
          contactEmail: contact.contactEmail,
          approved: contact.approved,
          liabilityAccount: contact.liabilityAccount,
        }));
      },
    }),
  );
};
