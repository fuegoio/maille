import {
  ActivityType,
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type ActivityMovement,
  type Transaction,
} from "@maille/core/activities";
import { builder } from "../builder";
import {
  ActivityCategorySchema,
  ActivitySchema,
  ActivitySubCategorySchema,
  DeleteActivityResponseSchema,
  DeleteTransactionResponseSchema,
  TransactionSchema,
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
import { db } from "@/database";
import { addEvent } from "@/api/events";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { GraphQLError } from "graphql";
import { validateWorkspace } from "@/services/workspaces";

const TransactionInput = builder.inputType("TransactionInput", {
  fields: (t) => ({
    id: t.field({
      type: "UUID",
    }),
    amount: t.float(),
    fromAccount: t.field({ type: "UUID" }),
    fromUser: t.field({ type: "String", required: false }),
    toAccount: t.field({ type: "UUID" }),
    toUser: t.field({ type: "String", required: false }),
  }),
});

const ActivityMovementInput = builder.inputType("ActivityMovementInput", {
  fields: (t) => ({
    id: t.field({
      type: "UUID",
    }),
    movement: t.field({
      type: "UUID",
    }),
    amount: t.float(),
  }),
});

export const registerActivitiesMutations = () => {
  builder.mutationField("createActivity", (t) =>
    t.field({
      type: ActivitySchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg.string(),
        description: t.arg.string({ required: false }),
        date: t.arg({ type: "Date" }),
        type: t.arg.string(),
        category: t.arg({
          type: "UUID",
          required: false,
        }),
        subcategory: t.arg({
          type: "UUID",
          required: false,
        }),
        project: t.arg({
          type: "UUID",
          required: false,
        }),
        workspace: t.arg({
          type: "UUID",
          required: true,
        }),
        transactions: t.arg({
          type: [TransactionInput],
          required: false,
        }),
        movement: t.arg({
          type: ActivityMovementInput,
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspace, ctx.user.id);

        const ActivityTypeEnum = z.nativeEnum(ActivityType);
        const activityType = ActivityTypeEnum.parse(args.type);

        const accountsQuery = await db.select().from(accounts);
        const number = await db
          .select({ number: max(activities.number) })
          .from(activities)
          .then(([{ number }]) => number! + 1);

        await db.insert(activities).values({
          id: args.id,
          user: ctx.user.id,
          workspace: args.workspace,
          number,
          name: args.name,
          description: args.description,
          date: new Date(args.date),
          type: activityType,
          category: args.category,
          subcategory: args.subcategory,
          project: args.project,
        });

        // Transactions
        const newTransactions: Transaction[] = [];
        args.transactions?.forEach(async (transaction) => {
          const newTransaction = (
            await db
              .insert(transactions)
              .values({
                id: transaction.id,
                amount: transaction.amount,
                fromAccount: transaction.fromAccount,
                fromUser: transaction.fromUser,
                toAccount: transaction.toAccount,
                toUser: transaction.toUser,
                activity: args.id,
              })
              .returning()
          )[0];

          newTransactions.push(newTransaction);
        });

        // Movements
        let newMovements: ActivityMovement[] = [];
        if (args.movement) {
          const movementActivity = {
            id: args.movement.id,
            user: ctx.user.id,
            workspace: args.workspace ?? null,
            activity: args.id,
            movement: args.movement.movement,
            amount: args.movement.amount,
          };
          await db.insert(movementsActivities).values(movementActivity);
          newMovements = [movementActivity];
        }

        await addEvent({
          type: "createActivity",
          payload: {
            id: args.id,
            number,
            user: ctx.user.id,
            name: args.name,
            description: args.description ?? null,
            date: args.date.toISOString(),
            type: activityType,
            category: args.category ?? null,
            subcategory: args.subcategory ?? null,
            project: args.project ?? null,
            transactions: newTransactions,
            movement: args.movement ? { ...args.movement } : undefined,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          id: args.id,
          number,
          user: ctx.user.id,
          name: args.name,
          description: args.description ?? null,
          date: args.date,
          type: activityType,
          category: args.category ?? null,
          subcategory: args.subcategory ?? null,
          project: args.project ?? null,
          transactions: newTransactions,
          movements: newMovements,
          amount: getActivityTransactionsReconciliationSum(
            activityType,
            newTransactions,
            accountsQuery,
          ),
          status: getActivityStatus(
            args.date,
            newTransactions,
            newMovements,
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
                date: movement.date,
                status: "completed",
                activities: [],
              };
            },
          ),
        };
      },
    }),
  );

  builder.mutationField("updateActivity", (t) =>
    t.field({
      type: ActivitySchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg({
          type: "String",
          required: false,
        }),
        description: t.arg({
          type: "String",
          required: false,
        }),
        date: t.arg({
          type: "Date",
          required: false,
        }),
        type: t.arg({
          type: "String",
          required: false,
        }),
        category: t.arg({
          type: "UUID",
          required: false,
        }),
        subcategory: t.arg({
          type: "UUID",
          required: false,
        }),
        project: t.arg({
          type: "UUID",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(
              and(eq(activities.id, args.id), eq(activities.user, ctx.user.id)),
            )
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        // Validate workspace from the activity
        await validateWorkspace(activity.workspace, ctx.user.id);

        const activityUpdates: Partial<typeof activity> = {};
        if (args.name) {
          activityUpdates.name = args.name;
        }
        if (args.description) {
          activityUpdates.description = args.description;
        }
        if (args.date) {
          activityUpdates.date = args.date;
        }
        if (args.type) {
          const ActivityTypeEnum = z.nativeEnum(ActivityType);
          activityUpdates.type = ActivityTypeEnum.parse(args.type);
          activityUpdates.category = null;
          activityUpdates.subcategory = null;
        }

        // Optional fields
        if (args.category !== undefined) {
          activityUpdates.category = args.category;
          activityUpdates.subcategory = null;
        }
        if (args.subcategory !== undefined) {
          activityUpdates.subcategory = args.subcategory;
        }
        if (args.project !== undefined) {
          activityUpdates.project = args.project;
        }

        const updatedActivity = (
          await db
            .update(activities)
            .set(activityUpdates)
            .where(eq(activities.id, args.id))
            .returning()
        )[0];

        addEvent({
          type: "updateActivity",
          payload: {
            id: args.id,
            ...activityUpdates,
            date: activityUpdates.date?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        const accountsQuery = await db.select().from(accounts);
        const transactionsData = await db
          .select()
          .from(transactions)
          .where(eq(transactions.activity, args.id));
        const movementsData = await db
          .select()
          .from(movementsActivities)
          .where(eq(movementsActivities.activity, args.id));

        return {
          ...updatedActivity,
          date: updatedActivity.date,
          transactions: transactionsData,
          movements: movementsData,
          amount: getActivityTransactionsReconciliationSum(
            updatedActivity.type,
            transactionsData,
            accountsQuery,
          ),
          status: getActivityStatus(
            updatedActivity.date,
            transactionsData,
            movementsData,
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
                date: movement.date,
                status: "completed",
                activities: [],
              };
            },
          ),
        };
      },
    }),
  );

  builder.mutationField("deleteActivity", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(eq(activities.id, args.id))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        // Validate workspace from the activity
        if (activity.workspace) {
          await validateWorkspace(activity.workspace, ctx.user.id);
        }

        await db.delete(transactions).where(eq(transactions.activity, args.id));
        await db
          .delete(movementsActivities)
          .where(eq(movementsActivities.activity, args.id));
        await db.delete(activities).where(eq(activities.id, args.id));

        await addEvent({
          type: "deleteActivity",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return {
          id: args.id,
          success: true,
        };
      },
    }),
  );

  builder.mutationField("addTransaction", (t) =>
    t.field({
      type: TransactionSchema,
      args: {
        activityId: t.arg({
          type: "UUID",
        }),
        id: t.arg({
          type: "UUID",
        }),
        amount: t.arg({
          type: "Float",
        }),
        fromAccount: t.arg({ type: "UUID" }),
        fromUser: t.arg({ type: "UUID", required: false }),
        toAccount: t.arg({ type: "UUID" }),
        toUser: t.arg({ type: "UUID", required: false }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(eq(activities.id, args.activityId))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        // Validate workspace from the activity
        if (activity.workspace) {
          await validateWorkspace(activity.workspace, ctx.user.id);
        }

        const newTransaction = (
          await db
            .insert(transactions)
            .values({
              id: args.id,
              amount: args.amount,
              fromAccount: args.fromAccount,
              fromUser: args.fromUser,
              toAccount: args.toAccount,
              toUser: args.toUser,
              activity: args.activityId,
            })
            .returning()
        )[0];

        addEvent({
          type: "addTransaction",
          payload: {
            activityId: args.activityId,
            ...newTransaction,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return newTransaction;
      },
    }),
  );

  builder.mutationField("updateTransaction", (t) =>
    t.field({
      type: TransactionSchema,
      args: {
        activityId: t.arg({
          type: "UUID",
          required: true,
        }),
        id: t.arg({
          type: "UUID",
          required: true,
        }),
        amount: t.arg({
          type: "Float",
          required: false,
        }),
        fromAccount: t.arg({
          type: "UUID",
          required: false,
        }),
        fromUser: t.arg({
          type: "UUID",
          required: false,
        }),
        toAccount: t.arg({
          type: "UUID",
          required: false,
        }),
        toUser: t.arg({
          type: "UUID",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(eq(activities.id, args.activityId))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        await validateWorkspace(activity.workspace, ctx.user.id);

        const transaction = (
          await db
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.id, args.id),
                eq(transactions.activity, args.activityId),
              ),
            )
            .limit(1)
        )[0];
        if (!transaction) {
          throw new GraphQLError("Transaction not found");
        }

        const updatedFields: Partial<typeof transaction> = {};
        if (args.amount !== null) updatedFields.amount = args.amount;
        if (args.fromAccount) updatedFields.fromAccount = args.fromAccount;
        if (args.fromUser) updatedFields.fromUser = args.fromUser;
        if (args.toAccount) updatedFields.toAccount = args.toAccount;
        if (args.toUser) updatedFields.toUser = args.toUser;

        const updatedTransaction = (
          await db
            .update(transactions)
            .set(updatedFields)
            .where(eq(transactions.id, args.id))
            .returning()
        )[0];

        addEvent({
          type: "updateTransaction",
          payload: {
            activityId: transaction.activity,
            id: args.id,
            ...updatedFields,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedTransaction;
      },
    }),
  );

  builder.mutationField("deleteTransaction", (t) =>
    t.field({
      type: DeleteTransactionResponseSchema,
      args: {
        activityId: t.arg({
          type: "UUID",
          required: true,
        }),
        id: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .where(eq(activities.id, args.activityId))
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        await validateWorkspace(activity.workspace, ctx.user.id);

        const transaction = (
          await db
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.id, args.id),
                eq(transactions.activity, args.activityId),
              ),
            )
            .limit(1)
        )[0];
        if (!transaction) {
          throw new GraphQLError("Transaction not found");
        }

        await db.delete(transactions).where(eq(transactions.id, args.id));

        addEvent({
          type: "deleteTransaction",
          payload: {
            activityId: transaction.activity,
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return { id: args.id, success: true };
      },
    }),
  );

  builder.mutationField("createActivityCategory", (t) =>
    t.field({
      type: ActivityCategorySchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg.string(),
        type: t.arg.string(),
        workspace: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspace, ctx.user.id);

        const activityTypeSchema = z.nativeEnum(ActivityType);
        const parsedType = activityTypeSchema.parse(args.type);

        const category = {
          id: args.id,
          workspace: args.workspace,
          name: args.name,
          type: parsedType,
        };
        await db.insert(activityCategories).values(category);

        await addEvent({
          type: "createActivityCategory",
          payload: category,
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return category;
      },
    }),
  );

  builder.mutationField("updateActivityCategory", (t) =>
    t.field({
      type: ActivityCategorySchema,
      args: {
        id: t.arg({
          type: "UUID",
          required: true,
        }),
        name: t.arg.string(),
      },
      resolve: async (root, args, ctx) => {
        const category = (
          await db
            .select()
            .from(activityCategories)
            .where(eq(activityCategories.id, args.id))
            .limit(1)
        )[0];
        if (!category) {
          throw new GraphQLError("Activity category not found");
        }

        await validateWorkspace(category.workspace, ctx.user.id);

        const updatedCategory = await db
          .update(activityCategories)
          .set({
            name: args.name,
          })
          .where(eq(activityCategories.id, args.id))
          .returning();

        await addEvent({
          type: "updateActivityCategory",
          payload: {
            id: args.id,
            name: args.name,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedCategory[0];
      },
    }),
  );

  builder.mutationField("deleteActivityCategory", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const category = (
          await db
            .select()
            .from(activityCategories)
            .where(eq(activityCategories.id, args.id))
            .limit(1)
        )[0];
        if (!category) {
          throw new GraphQLError("Activity category not found");
        }

        // Validate workspace from the category
        if (category.workspace) {
          await validateWorkspace(category.workspace, ctx.user.id);
        }

        await db
          .update(activities)
          .set({
            category: null,
            subcategory: null,
          })
          .where(
            and(
              eq(activities.category, args.id),
              eq(activities.user, ctx.user.id),
            ),
          );
        await db
          .delete(activityCategories)
          .where(eq(activityCategories.id, args.id));

        await addEvent({
          type: "deleteActivityCategory",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return { id: args.id, success: true };
      },
    }),
  );

  builder.mutationField("createActivitySubCategory", (t) =>
    t.field({
      type: ActivitySubCategorySchema,
      args: {
        id: t.arg({
          type: "UUID",
        }),
        name: t.arg.string(),
        category: t.arg({
          type: "UUID",
        }),
        workspace: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspace, ctx.user.id);

        const subcategory = {
          id: args.id,
          workspace: args.workspace,
          name: args.name,
          category: args.category,
        };
        await db.insert(activitySubcategories).values(subcategory);

        await addEvent({
          type: "createActivitySubCategory",
          payload: subcategory,
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return subcategory;
      },
    }),
  );

  builder.mutationField("updateActivitySubCategory", (t) =>
    t.field({
      type: ActivitySubCategorySchema,
      args: {
        id: t.arg({
          type: "UUID",
          required: true,
        }),
        name: t.arg.string(),
      },
      resolve: async (root, args, ctx) => {
        const subcategory = (
          await db
            .select()
            .from(activitySubcategories)
            .where(eq(activitySubcategories.id, args.id))
            .limit(1)
        )[0];
        if (!subcategory) {
          throw new GraphQLError("Activity subcategory not found");
        }

        // Validate workspace from the subcategory
        if (subcategory.workspace) {
          await validateWorkspace(subcategory.workspace, ctx.user.id);
        }

        const updatedSubCategory = await db
          .update(activitySubcategories)
          .set({
            name: args.name,
          })
          .where(eq(activitySubcategories.id, args.id))
          .returning();

        await addEvent({
          type: "updateActivitySubCategory",
          payload: {
            id: args.id,
            name: args.name,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return updatedSubCategory[0];
      },
    }),
  );

  builder.mutationField("deleteActivitySubCategory", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "UUID",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const subCategory = (
          await db
            .select()
            .from(activitySubcategories)
            .where(eq(activitySubcategories.id, args.id))
            .limit(1)
        )[0];
        if (!subCategory) {
          throw new GraphQLError("Activity subcategory not found");
        }

        await validateWorkspace(subCategory.workspace, ctx.user.id);

        await db
          .update(activities)
          .set({
            subcategory: null,
          })
          .where(eq(activities.subcategory, args.id));
        await db
          .delete(activitySubcategories)
          .where(eq(activitySubcategories.id, args.id));

        await addEvent({
          type: "deleteActivitySubCategory",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
        });

        return { id: args.id, success: true };
      },
    }),
  );
};
