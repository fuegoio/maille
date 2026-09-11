import { db } from "@/database";
import { builder } from "../builder";
import { ActivityCategorySchema, ActivitySchema, ActivitySubCategorySchema } from "./schemas";
import { toFundMoves } from "@/api/funds/transactions";
import {
  accounts,
  activities,
  activityCategories,
  activitySubcategories,
  movements,
  movementsActivities,
  transactions,
} from "@/tables";
import { eq } from "drizzle-orm";
import {
  getActivitySharingsReconciliation,
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
} from "@maille/core/activities";
import { getActivitySharings } from "@/services/sharing";

export const registerActivitiesQueries = () => {
  builder.queryField("activities", (t) =>
    t.field({
      type: [ActivitySchema],
      resolve: async (root, args, ctx) => {
        const accountsQuery = await db
          .select()
          .from(accounts)
          .where(eq(accounts.user, ctx.user.id));

        const activitiesData = await db
          .select()
          .from(activities)
          .where(eq(activities.user, ctx.user.id));

        const movementsData = await db
          .select()
          .from(movements)
          .where(eq(movements.user, ctx.user.id));

        return activitiesData.map(async (activity) => {
          const activityTransactions = await db
            .select()
            .from(transactions)
            .where(eq(transactions.activity, activity.id));

          const activityMovements = await db
            .select()
            .from(movementsActivities)
            .where(eq(movementsActivities.activity, activity.id));

          // Legs live on the transaction rows; hand them over as complete
          // fund moves (dates as Date) to GraphQL and the reconcilers.
          const transactionsWithMoves = activityTransactions.map((transaction) => ({
            ...transaction,
            fundMoves: toFundMoves(transaction.id, transaction.fundMoves),
          }));

          return {
            ...activity,
            transactions: transactionsWithMoves,
            movements: activityMovements,
            amount: getActivityTransactionsReconciliationSum(
              activity.type,
              transactionsWithMoves,
              accountsQuery,
            ),
            status: getActivityStatus(
              activity.date,
              transactionsWithMoves,
              activityMovements,
              accountsQuery,
              (id) => {
                const movement = movementsData.find((m) => m.id === id);
                if (!movement) return;
                return {
                  ...movement,
                  date: movement.date,
                  status: "completed",
                  activities: [],
                };
              },
            ),
            sharing: getActivitySharingsReconciliation(
              await getActivitySharings(activity.id, ctx.user.id),
              ctx.user.id,
            ),
          };
        });
      },
    }),
  );

  builder.queryField("activityCategories", (t) =>
    t.field({
      type: [ActivityCategorySchema],
      resolve: async (root, args, ctx) => {
        return await db
          .select()
          .from(activityCategories)
          .where(eq(activityCategories.user, ctx.user.id));
      },
    }),
  );

  builder.queryField("activitySubcategories", (t) =>
    t.field({
      type: [ActivitySubCategorySchema],
      resolve: async (root, args, ctx) => {
        return await db
          .select()
          .from(activitySubcategories)
          .where(eq(activitySubcategories.user, ctx.user.id));
      },
    }),
  );
};
