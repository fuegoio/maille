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
        linkId: t.arg({
          type: "UUID",
        }),
      },
      resolve: async (root, { linkId, account, amount, name, date }, ctx) => {
        const liability = (
          await db
            .select()
            .from(liabilities)
            .where(
              and(
                eq(liabilities.linkId, linkId),
                eq(liabilities.user, ctx.user),
              ),
            )
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
            .where(
              and(
                eq(liabilities.user, ctx.user),
                eq(liabilities.linkId, linkId),
              ),
            );
        } else {
          await db.insert(liabilities).values({
            linkId,
            user: ctx.user,
            account,
            amount,

            name,
            date,
          });
        }

        return {
          linkId,
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
