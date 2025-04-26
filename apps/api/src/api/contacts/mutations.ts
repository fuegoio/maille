import { db } from "@/database";
import { builder } from "../builder";
import { accounts, contacts, users } from "@/tables";
import { AccountType } from "@maille/core/accounts";
import { and, eq, or } from "drizzle-orm";
import { GraphQLError } from "graphql";

export const registerContactsMutations = () => {
  builder.mutationField("createContact", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({
          type: "UUID",
        }),
        email: t.arg({ type: "String" }),
        liabilityAccountId: t.arg({
          type: "UUID",
        }),
      },
      resolve: async (root, { id, email, liabilityAccountId }, ctx) => {
        // Contact user
        const contactUsers = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (contactUsers.length === 0) {
          throw new GraphQLError("No user found with this email");
        }

        const contactUser = contactUsers[0];

        // Create a liability account for the contact
        await db.insert(accounts).values({
          id: liabilityAccountId,
          name: contactUser.first_name + " " + contactUser.last_name,
          user: ctx.user,
          type: AccountType.LIABILITIES,
        });

        // Create a contact for the user
        await db.insert(contacts).values({
          id: id,
          user: ctx.user,
          contact: contactUser.id,
          contactEmail: email,
          approved: true,
          liabilityAccount: liabilityAccountId,
        });

        // Create a contact for the contact user
        const myself = (
          await db.select().from(users).where(eq(users.id, ctx.user)).limit(1)
        )[0]!;
        await db.insert(contacts).values({
          id: id,
          user: contactUser.id,
          contact: ctx.user,
          contactEmail: myself.email,
          approved: false,
        });

        return true;
      },
    }),
  );

  builder.mutationField("approveContact", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({
          type: "UUID",
        }),
        liabilityAccountId: t.arg({
          type: "UUID",
        }),
      },
      resolve: async (root, { id, liabilityAccountId }, ctx) => {
        // Fetch the contact
        const contact = await db
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, id), eq(contacts.user, ctx.user)))
          .limit(1);

        if (contact.length === 0) {
          throw new GraphQLError("No contact found with this ID");
        }

        const contactUser = contact[0];

        // Create a liability account for the contact
        await db.insert(accounts).values({
          id: liabilityAccountId,
          name: contactUser.contactEmail,
          user: ctx.user,
          type: AccountType.LIABILITIES,
        });

        // Update the contact to set the liability account and approve it
        await db
          .update(contacts)
          .set({
            approved: true,
            liabilityAccount: liabilityAccountId,
          })
          .where(eq(contacts.id, id));

        return true;
      },
    }),
  );

  builder.mutationField("deleteContact", (t) =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg({
          type: "UUID",
        }),
      },
      resolve: async (root, { id }, ctx) => {
        // Fetch the contact
        const contact = await db
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, id), eq(contacts.user, ctx.user)))
          .limit(1);

        if (contact.length === 0) {
          throw new GraphQLError("No contact found with this ID");
        }

        const contactUser = contact[0];

        // Delete the contact from both sides
        await db
          .delete(contacts)
          .where(
            or(
              and(
                eq(contacts.user, ctx.user),
                eq(contacts.contact, contactUser.contact),
              ),
              and(
                eq(contacts.user, contactUser.contact),
                eq(contacts.contact, ctx.user),
              ),
            ),
          );

        return true;
      },
    }),
  );
};
