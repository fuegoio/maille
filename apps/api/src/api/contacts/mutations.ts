import { db } from "@/database";
import { builder } from "../builder";
import { ContactSchema } from "./schemas";
import { addEvent } from "../events";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { contacts, user as userTable } from "@/tables";

export const registerContactsMutations = () => {
  builder.mutationField("createContact", (t) =>
    t.field({
      type: ContactSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        contact: t.arg.string(),
      },
      resolve: async (root, args, ctx) => {
        const contactResults = await db
          .insert(contacts)
          .values({
            id: args.id,
            user: ctx.user.id,
            contact: args.contact,
            createdAt: new Date(),
          })
          .returning();
        const contact = contactResults[0];

        if (!contact) {
          throw new GraphQLError("Failed to create contact");
        }

        await addEvent({
          type: "createContact",
          payload: {
            id: args.id,
            contact: args.contact,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        // Fetch the user data for the contact
        const userData = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, contact.contact))
          .limit(1);

        const user = userData[0];

        if (!user) {
          throw new Error(`User not found for contact ID: ${contact.contact}`);
        }

        // Return the full Contact object with user data
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
      },
    }),
  );

  builder.mutationField("deleteContact", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const contact = (
          await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, args.id), eq(contacts.user, ctx.user.id)))
        )[0];
        if (!contact) {
          throw new GraphQLError("Contact not found");
        }

        await db.delete(contacts).where(eq(contacts.id, args.id));

        await addEvent({
          type: "deleteContact",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return true;
      },
    }),
  );
};
