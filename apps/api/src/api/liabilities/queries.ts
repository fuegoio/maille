import { db } from "@/database";
import { builder } from "../builder";
import { LiabilitySchema } from "./schemas";
import { liabilities } from "@/tables";
import dayjs from "dayjs";

export const registerLiabilitiesQueries = () => {
  builder.queryField("liabilities", (t) =>
    t.field({
      type: [LiabilitySchema],
      resolve: async () => {
        const liabilitiesData = await db.select().from(liabilities);

        return liabilitiesData.map((liability) => {
          return {
            id: liability.id,
            account: liability.account,
            activity: liability.activity,
            amount: liability.amount,
            name: liability.name,
            date: dayjs(liability.date),
          };
        });
      },
    }),
  );
};
