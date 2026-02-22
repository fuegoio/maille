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
import { and, eq, inArray } from "drizzle-orm";
import {
  getActivityLiabilities,
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type BaseActivity,
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
        // Validate workspace
        await validateWorkspace(args.workspaceId, ctx.user.id);

        const accountsQuery = await db
          .select()
          .from(accounts)
          .where(and(eq(accounts.workspace, args.workspaceId), eq(accounts.user, ctx.user.id)));

        const counterpartiesData = await db
          .select()
          .from(counterparties)
          .where(eq(counterparties.workspace, args.workspaceId));

        const activitiesUsersData = await db
          .select()
          .from(activitiesUsers)
          .where(eq(activitiesUsers.user, ctx.user.id));

        const activitiesData = await db
          .select()
          .from(activities)
          .leftJoin(activitiesUsers, eq(activitiesUsers.activity, activities.id))
          .leftJoin(transactions, eq(activities.id, transactions.activity))
          .leftJoin(movementsActivities, and(eq(activities.id, movementsActivities.activity)))
          .where(
            and(
              inArray(
                activities.id,
                activitiesUsersData.map((a) => a.activity),
              ),
              eq(activities.workspace, args.workspaceId),
            ),
          );

        return activitiesData
          .reduce<BaseActivity[]>((acc, row) => {
            if (!row.activities) return acc;

            let activity = acc.find((a) => a.id === row.activities.id);
            if (!activity) {
              activity = {
                ...row.activities,
                date: row.activities.date,
                users: [],
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

            if (row.activities_users) {
              activity.users.push(row.activities_users.user);
            }

            return acc;
          }, [])
          .map((a) => ({
            ...a,
            transactions: a.transactions.filter((t) => t.user === ctx.user.id),
            amount: getActivityTransactionsReconciliationSum(a.type, a.transactions, accountsQuery),
            status: getActivityStatus(a.date, a.transactions, a.movements, accountsQuery, (id) => {
              const movement = db.select().from(movements).where(eq(movements.id, id)).get();
              if (!movement) return;
              return {
                ...movement,
                date: movement.date,
                status: "completed",
                activities: [],
              };
            }),
            liabilities: getActivityLiabilities(a.transactions, counterpartiesData, ctx.user.id),
          }));
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
