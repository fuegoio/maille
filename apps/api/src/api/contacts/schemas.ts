import { builder } from "@/api/builder";
import type { Contact } from "@maille/core/contacts";

export const ContactSchema = builder.objectRef<Contact>("Contact");

ContactSchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "UUID",
      resolve: (parent) => parent.id,
    }),
    contact: t.field({
      type: "UUID",
      resolve: (parent) => parent.contact,
    }),
    contactEmail: t.exposeString("contactEmail"),
    approved: t.exposeBoolean("approved"),
    liabilityAccount: t.field({
      type: "UUID",
      nullable: true,
      resolve: (parent) => {
        return parent.liabilityAccount;
      },
    }),
  }),
});
