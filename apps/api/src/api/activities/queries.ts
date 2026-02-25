import { db } from "@/database";
import { builder } from "../builder";
import { ActivityCategorySchema, ActivitySchema, ActivitySubCategorySchema } from "./schemas";
import {
  accounts,
  activities,
  activitiesSharing,
  activityCategories,
  activitySubcategories,
  counterparties,
  movements,
  movementsActivities,
  transactions,
} from "@/tables";
import { and, eq } from "drizzle-orm";
import {
  getActivityLiabilities,
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
} from "@maille/core/activities";

export const registerActivitiesQueries = () => {
  builder.queryField("activities", (t) =>
    t.field({
      type: [ActivitySchema],
      resolve: async (root, args, ctx) => {
        const accountsQuery = await db
          .select()
          .from(accounts)
          .where(eq(accounts.user, ctx.user.id));

        const counterpartiesData = await db
          .select()
          .from(counterparties)
          .where(eq(counterparties.user, ctx.user.id));

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

          const activitySharingId = (
            await db
              .select()
              .from(activitiesSharing)
              .where(eq(activitiesSharing.activity, activity.id))
          )[0]?.sharingId;
          const activitySharings = activitySharingId
            ? await db
                .select()
                .from(activitiesSharing)
                .where(eq(activitiesSharing.sharingId, activitySharingId))
            : [];

          return {
            ...activity,
            users: activitySharings.map((au) => au.user),
            transactions: activityTransactions,
            movements: activityMovements,
            amount: getActivityTransactionsReconciliationSum(
              activity.type,
              activityTransactions,
              accountsQuery,
            ),
            status: getActivityStatus(
              activity.date,
              activityTransactions,
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
            liabilities: getActivityLiabilities(
              activityTransactions,
              counterpartiesData,
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
