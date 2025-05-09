import { db } from "@/database";
import { builder } from "../builder";
import {
  ActivityCategorySchema,
  ActivitySchema,
  ActivitySubCategorySchema,
} from "./schemas";
import {
  accounts,
  activities,
  activityCategories,
  activitySubcategories,
  movements,
  movementsActivities,
  transactions,
} from "@/tables";
import { and, eq } from "drizzle-orm";
import {
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type Activity,
} from "@maille/core/activities";
import dayjs from "dayjs";

export const registerActivitiesQueries = () => {
  builder.queryField("activities", (t) =>
    t.field({
      type: [ActivitySchema],
      resolve: async () => {
        const accountsQuery = await db.select().from(accounts);
        const activitiesData = await db
          .select()
          .from(activities)
          .leftJoin(transactions, eq(activities.id, transactions.activity))
          .leftJoin(
            movementsActivities,
            and(eq(activities.id, movementsActivities.activity)),
          );

        return activitiesData
          .reduce<Omit<Activity, "amount" | "status">[]>((acc, row) => {
            if (!row.activities) return acc;

            let activity = acc.find((a) => a.id === row.activities.id);
            if (!activity) {
              activity = {
                ...row.activities,
                date: dayjs(row.activities.date),
                transactions: [],
                movements: [],
              };
              acc.push(activity);
            }

            if (row.transactions) {
              activity.transactions.push(row.transactions);
            }

            if (row.movements_activities) {
              activity.movements.push(row.movements_activities);
            }

            return acc;
          }, [])
          .map((a) => ({
            ...a,
            amount: getActivityTransactionsReconciliationSum(
              a.type,
              a.transactions,
              accountsQuery,
            ),
            status: getActivityStatus(
              dayjs(a.date),
              a.transactions,
              a.movements,
              accountsQuery,
              (id) => {
                const movement = db
                  .select()
                  .from(movements)
                  .where(eq(movements.id, id))
                  .get();
                if (!movement) return;
                return {
                  ...movement,
                  date: dayjs(movement.date),
                  status: "completed",
                  activities: [],
                };
              },
            ),
          }));
      },
    }),
  );

  builder.queryField("activityCategories", (t) =>
    t.field({
      type: [ActivityCategorySchema],
      resolve: async () => {
        return await db.select().from(activityCategories);
      },
    }),
  );

  builder.queryField("activitySubcategories", (t) =>
    t.field({
      type: [ActivitySubCategorySchema],
      resolve: async () => {
        return await db.select().from(activitySubcategories);
      },
    }),
  );
};
