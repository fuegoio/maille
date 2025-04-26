import { db } from "@/database";
import { builder } from "../builder";
import { LiabilitySchema } from "./schemas";
import { liabilities } from "@/tables";
import { eq } from "drizzle-orm";
import type { Liability } from "@maille/core/liabilities";
import dayjs from "dayjs";

export const registerLiabilitiesQueries = () => {
  builder.queryField("liabilities", (t) =>
    t.field({
      type: [LiabilitySchema],
      resolve: async (root, args, ctx) => {
        const liabilitiesData = await db
          .select()
          .from(liabilities)
          .where(eq(liabilities.user, ctx.user));

        return liabilitiesData.map((liability) => {
          const linkedLiability = db
            .select()
            .from(liabilities)
            .where(eq(liabilities.linkId, liability.linkId))
            .get();

          return {
            account: liability.account,
            activity: liability.activity,
            amount: liability.amount,
            name: liability.name,
            date: dayjs(liability.date),

            linkId: liability.linkId,
            linkedAmount: linkedLiability?.amount,
            status: (linkedLiability === undefined ||
            linkedLiability.amount === liability.amount
              ? "completed"
              : "incomplete") as Liability["status"],
          };
        });
      },
    }),
  );
};
