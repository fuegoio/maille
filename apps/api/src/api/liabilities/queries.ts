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
            ...liability,
            date: dayjs(liability.date),
          };
        });
      },
    }),
  );
};
