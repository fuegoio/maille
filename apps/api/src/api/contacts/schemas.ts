import { builder } from "../builder";
import { type Contact, type ContactUser } from "@maille/core/contacts";

export const ContactSchema = builder.objectRef<Contact>("Contact");

ContactSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    contact: t.expose("contact", {
      type: ContactUserSchema,
    }),
    createdAt: t.field({
      type: "Date",
      resolve: (parent) => parent.createdAt,
    }),
  }),
});

export const ContactUserSchema = builder.objectRef<ContactUser>("ContactUser");

ContactUserSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    image: t.exposeString("image"),
  }),
});
