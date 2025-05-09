import { db } from "@/database";
import { builder } from "../builder";
import { liabilities } from "@/tables";
import { and, eq } from "drizzle-orm";
import { LiabilitySchema } from "./schemas";
import dayjs from "dayjs";

export const registerLiabilitiesMutations = () => {
  builder.mutationField("importLiability", (t) =>
    t.field({
      type: LiabilitySchema,
      args: {
        account: t.arg({
          type: "UUID",
        }),
        amount: t.arg({
          type: "Float",
        }),
        name: t.arg({
          type: "String",
        }),
        date: t.arg({
          type: "Date",
        }),
        id: t.arg({
          type: "UUID",
        }),
      },
      resolve: async (root, { id, account, amount, name, date }, ctx) => {
        const liability = (
          await db
            .select()
            .from(liabilities)
            .where(and(eq(liabilities.id, id), eq(liabilities.user, ctx.user)))
            .limit(1)
        )[0];

        if (liability) {
          await db
            .update(liabilities)
            .set({
              account,
              amount,
              name,
              date,
            })
            .where(and(eq(liabilities.user, ctx.user), eq(liabilities.id, id)));
        } else {
          await db.insert(liabilities).values({
            id,
            user: ctx.user,
            account,
            amount,

            name,
            date,
          });
        }

        return {
          id,
          account,
          amount,
          name,
          date: dayjs(date),
          activity: null,
          status: "incomplete" as const,
        };
      },
    }),
  );
};
