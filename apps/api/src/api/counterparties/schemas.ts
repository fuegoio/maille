import { builder } from "@/api/builder";
import type { Counterparty } from "@maille/core/accounts";

export const CounterpartySchema = builder.objectRef<Counterparty>("Counterparty");

CounterpartySchema.implement({
  fields: (t) => ({
    id: t.field({
      type: "String",
      resolve: (parent) => parent.id,
    }),
    account: t.exposeString("account"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    contact: t.exposeString("contact", { nullable: true }),
  }),
});
