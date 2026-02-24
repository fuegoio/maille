import { builder } from "../builder";
import { CounterpartySchema } from "./schemas";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { counterparties } from "@/tables";

export const registerCounterpartiesQueries = () => {
  builder.queryField("counterparties", (t) =>
    t.field({
      type: [CounterpartySchema],
      resolve: async (root, args, ctx) => {
        const counterpartiesQuery = await db
          .select()
          .from(counterparties)
          .where(eq(counterparties.user, ctx.user.id));

        return counterpartiesQuery;
      },
    }),
  );
};
