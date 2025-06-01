import { db } from "@/database";
import { builder } from "../builder";
import { liabilities } from "@/tables";
import { and, eq } from "drizzle-orm";
import { LiabilitySchema } from "./schemas";
import { addEvent } from "@/api/events";
import dayjs from "dayjs";

export const registerLiabilitiesMutations = () => {
  builder.mutationField("updateLiability", (t) =>
    t.field({
      type: LiabilitySchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg({
          type: "String",
          required: false,
        }),
        other: t.arg({
          type: "String",
          required: false,
        }),
        other_user: t.arg({
          type: "UUID",
          required: false,
        }),
      },
      resolve: async (root, { id, name, other, other_user }, ctx) => {
        const liability = (
          await db
            .select()
            .from(liabilities)
            .where(eq(liabilities.id, id))
            .limit(1)
        )[0];

        if (!liability) {
          throw new Error("Liability not found");
        }

        const liabilityUpdates: Partial<typeof liability> = {};
        if (name) {
          liabilityUpdates.name = name;
        }
        if (other) {
          liabilityUpdates.other = other;
        }
        if (other_user) {
          liabilityUpdates.other_user = other_user;
        }

        await db
          .update(liabilities)
          .set(liabilityUpdates)
          .where(eq(liabilities.id, id));

        await addEvent({
          type: "updateLiability",
          payload: {
            id,
            ...liabilityUpdates,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
        });

        return {
          ...liability,
          ...liabilityUpdates,
          date: dayjs(liability.date),
        };
      },
    }),
  );
};
