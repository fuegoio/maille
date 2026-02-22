import { db } from "@/database";
import { builder } from "../builder";
import { ActivityCategorySchema, ActivitySchema, ActivitySubCategorySchema } from "./schemas";
import {
  accounts,
  activities,
  activitiesUsers,
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
import { validateWorkspace } from "@/services/workspaces";

export const registerActivitiesQueries = () => {
  builder.queryField("activities", (t) =>
    t.field({
      type: [ActivitySchema],
      args: {
        workspaceId: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args, ctx) => {
        await validateWorkspace(args.workspaceId, ctx.user.id);

        const accountsQuery = await db
          .select()
          .from(accounts)
          .where(and(eq(accounts.workspace, args.workspaceId), eq(accounts.user, ctx.user.id)));

        const counterpartiesData = await db
          .select()
          .from(counterparties)
          .where(eq(counterparties.workspace, args.workspaceId));

        const activitiesData = await db
          .select()
          .from(activities)
          .innerJoin(activitiesUsers, eq(activitiesUsers.activity, activities.id))
          .where(
            and(eq(activitiesUsers.user, ctx.user.id), eq(activities.workspace, args.workspaceId)),
          );

        return activitiesData.map(async (activity) => {
          const activityTransactions = await db
            .select()
            .from(transactions)
            .where(eq(transactions.activity, activity.activities.id));

          const activityMovements = await db
            .select()
            .from(movementsActivities)
            .where(eq(movementsActivities.activity, activity.activities.id));

          const activityUsers = await db
            .select()
            .from(activitiesUsers)
            .where(eq(activitiesUsers.id, activity.activities.id));

          return {
            ...activity.activities,
            users: activityUsers.map((au) => au.user),
            transactions: activityTransactions.filter((t) => t.user === ctx.user.id),
            movements: activityMovements,
            amount: getActivityTransactionsReconciliationSum(
              activity.activities.type,
              activityTransactions,
              accountsQuery,
            ),
            status: getActivityStatus(
              activity.activities.date,
              activityTransactions,
              activityMovements,
              accountsQuery,
              (id) => {
                const movement = db.select().from(movements).where(eq(movements.id, id)).get();
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
      args: {
        workspaceId: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspaceId, ctx.user.id);

        return await db
          .select()
          .from(activityCategories)
          .where(eq(activityCategories.workspace, args.workspaceId));
      },
    }),
  );

  builder.queryField("activitySubcategories", (t) =>
    t.field({
      type: [ActivitySubCategorySchema],
      args: {
        workspaceId: t.arg({ type: "String", required: true }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspaceId, ctx.user.id);

        return await db
          .select()
          .from(activitySubcategories)
          .where(eq(activitySubcategories.workspace, args.workspaceId));
      },
    }),
  );
};
