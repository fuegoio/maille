import {
  ActivityType,
  getActivityLiabilities,
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type ActivityMovement,
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
  activitiesUsers,
  activityCategories,
  activitySubcategories,
  counterparties,
  movements,
  movementsActivities,
  transactions,
} from "@/tables";
import { db } from "@/database";
import { addEvent } from "@/api/events";
import { and, eq, inArray, max } from "drizzle-orm";
import { z } from "zod";
import { GraphQLError } from "graphql";
import { validateWorkspace } from "@/services/workspaces";

const TransactionInput = builder.inputType("TransactionInput", {
  fields: (t) => ({
    id: t.field({
      type: "String",
    }),
    amount: t.float(),
    fromAccount: t.field({ type: "String" }),
    toAccount: t.field({ type: "String" }),
  }),
});

const ActivityMovementInput = builder.inputType("ActivityMovementInput", {
  fields: (t) => ({
    id: t.field({
      type: "String",
    }),
    movement: t.field({
      type: "String",
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
          type: "String",
        }),
        name: t.arg.string(),
        description: t.arg.string({ required: false }),
        date: t.arg({ type: "Date" }),
        type: t.arg.string(),
        category: t.arg({
          type: "String",
          required: false,
        }),
        subcategory: t.arg({
          type: "String",
          required: false,
        }),
        project: t.arg({
          type: "String",
          required: false,
        }),
        workspace: t.arg({
          type: "String",
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

        const ActivityTypeEnum = z.enum(ActivityType);
        const activityType = ActivityTypeEnum.parse(args.type);

        const accountsQuery = await db.select().from(accounts);
        const maxNumberResult = await db
          .select({ number: max(activities.number) })
          .from(activities)
          .then((result) => result[0]);

        const number = maxNumberResult?.number ? maxNumberResult.number + 1 : 1;

        await db.insert(activities).values({
          id: args.id,
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

        // Acttivity users
        await db.insert(activitiesUsers).values({
          id: args.id,
          user: ctx.user.id,
          activity: args.id,
        });

        // Transactions
        const transactionPromises =
          args.transactions?.map(async (transaction) => {
            const transactionResults = await db
              .insert(transactions)
              .values({
                id: transaction.id,
                user: ctx.user.id,
                amount: transaction.amount,
                fromAccount: transaction.fromAccount,
                toAccount: transaction.toAccount,
                activity: args.id,
              })
              .returning();
            const newTransaction = transactionResults[0];

            if (!newTransaction) {
              throw new GraphQLError("Failed to create transaction");
            }

            return newTransaction;
          }) || [];

        const newTransactions = await Promise.all(transactionPromises);

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
          workspace: args.workspace,
        });

        return {
          id: args.id,
          number,
          users: [ctx.user.id],
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
          liabilities: [],
        };
      },
    }),
  );

  builder.mutationField("updateActivity", (t) =>
    t.field({
      type: ActivitySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        users: t.arg({
          type: ["String"],
          required: false,
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
          type: "String",
          required: false,
        }),
        subcategory: t.arg({
          type: "String",
          required: false,
        }),
        project: t.arg({
          type: "String",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        let activity = (
          await db
            .select()
            .from(activities)
            .innerJoin(activitiesUsers, eq(activities.id, activitiesUsers.activity))
            .where(and(eq(activities.id, args.id), eq(activitiesUsers.user, ctx.user.id)))
            .limit(1)
        )[0]?.activities;
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        // Validate workspace from the activity
        await validateWorkspace(activity.workspace, ctx.user.id);

        const activityUpdates: Partial<typeof activity> = {};
        if (args.name) {
          activityUpdates.name = args.name;
        }
        if (args.description !== undefined) {
          activityUpdates.description = args.description;
        }
        if (args.date) {
          activityUpdates.date = args.date;
        }
        if (args.type) {
          const ActivityTypeEnum = z.enum(ActivityType);
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

        if (Object.keys(activityUpdates).length > 0) {
          const updatedActivities = await db
            .update(activities)
            .set(activityUpdates)
            .where(eq(activities.id, args.id))
            .returning();
          activity = updatedActivities[0];
          if (!activity) {
            throw new GraphQLError("Failed to update activity");
          }
        }

        // Counterparties
        const counterpartiesData = await db
          .select()
          .from(counterparties)
          .where(eq(counterparties.workspace, activity.workspace));

        // Transactions
        const transactionsData = await db
          .select()
          .from(transactions)
          .where(eq(transactions.activity, args.id));

        // Users
        const activityUsers = await db
          .select()
          .from(activitiesUsers)
          .where(eq(activitiesUsers.activity, args.id));
        let usersToRemove: string[] = [];
        if (args.users) {
          const usersToAdd = args.users.filter(
            (user) => !activityUsers.some((u) => u.user === user),
          );
          usersToRemove = activityUsers
            .filter((u) => !args.users?.includes(u.user))
            .map((u) => u.user);

          console.log(usersToAdd, usersToRemove);
          if (usersToAdd.length > 0) {
            await db.insert(activitiesUsers).values(
              usersToAdd.map((user) => ({
                id: crypto.randomUUID(),
                user,
                activity: args.id,
              })),
            );

            await Promise.all(
              usersToAdd.map((user) =>
                addEvent({
                  type: "createActivity",
                  payload: {
                    ...activity,
                    users: activityUsers.map((a) => a.user).concat(usersToAdd),
                    date: activity.date.toISOString(),
                    transactions: [],
                    liabilities: getActivityLiabilities(
                      transactionsData,
                      counterpartiesData,
                      ctx.user.id,
                    ),
                  },
                  createdAt: new Date(),
                  clientId: ctx.session.id,
                  user,
                  workspace: activity.workspace,
                }),
              ),
            );
          }

          if (usersToRemove.length > 0) {
            await db
              .delete(activitiesUsers)
              .where(
                and(
                  eq(activitiesUsers.activity, args.id),
                  inArray(activitiesUsers.user, usersToRemove),
                ),
              );

            await Promise.all(
              usersToRemove.map((user) =>
                addEvent({
                  type: "deleteActivity",
                  payload: {
                    id: args.id,
                  },
                  createdAt: new Date(),
                  clientId: ctx.session.id,
                  user,
                  workspace: activity.workspace,
                }),
              ),
            );
          }
        }

        activityUsers
          .filter((a) => !usersToRemove.includes(a.user))
          .forEach((activityUser) => {
            void addEvent({
              type: "updateActivity",
              payload: {
                id: args.id,
                ...activityUpdates,
                users: args.users ?? undefined,
                date: activityUpdates.date?.toISOString(),
              },
              createdAt: new Date(),
              clientId: ctx.session.id,
              user: activityUser.user,
              workspace: activity.workspace,
            });
          });

        const accountsQuery = await db.select().from(accounts);
        const movementsData = await db
          .select()
          .from(movementsActivities)
          .where(eq(movementsActivities.activity, args.id));

        return {
          ...activity,
          users: args.users ?? activityUsers.map((u) => u.user),
          date: activity.date,
          transactions: transactionsData.filter((t) => t.user === ctx.user.id),
          movements: movementsData,
          amount: getActivityTransactionsReconciliationSum(
            activity.type,
            transactionsData,
            accountsQuery,
          ),
          status: getActivityStatus(
            activity.date,
            transactionsData,
            movementsData,
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
          liabilities: getActivityLiabilities(transactionsData, counterpartiesData, ctx.user.id),
        };
      },
    }),
  );

  builder.mutationField("deleteActivity", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "String",
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .innerJoin(activitiesUsers, eq(activities.id, activitiesUsers.activity))
            .where(and(eq(activities.id, args.id), eq(activitiesUsers.user, ctx.user.id)))
            .limit(1)
        )[0]?.activities;
        if (!activity) {
          return {
            id: args.id,
            success: true,
          };
        }

        // Validate workspace from the activity
        await validateWorkspace(activity.workspace, ctx.user.id);

        // Users
        const activityUsers = await db
          .select()
          .from(activitiesUsers)
          .where(eq(activitiesUsers.activity, args.id));

        activityUsers.forEach((activityUser) => {
          void addEvent({
            type: "deleteActivity",
            payload: {
              id: args.id,
            },
            createdAt: new Date(),
            clientId: ctx.session.id,
            user: activityUser.user,
            workspace: activity.workspace,
          });
        });

        // Delete activity
        await db.delete(activitiesUsers).where(eq(activitiesUsers.activity, args.id));
        await db.delete(transactions).where(eq(transactions.activity, args.id));
        await db.delete(movementsActivities).where(eq(movementsActivities.activity, args.id));
        await db.delete(activities).where(eq(activities.id, args.id));

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
          type: "String",
        }),
        id: t.arg({
          type: "String",
        }),
        amount: t.arg({
          type: "Float",
        }),
        fromAccount: t.arg({ type: "String" }),
        toAccount: t.arg({ type: "String" }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .innerJoin(activitiesUsers, eq(activities.id, activitiesUsers.activity))
            .where(and(eq(activities.id, args.activityId), eq(activitiesUsers.user, ctx.user.id)))
            .limit(1)
        )[0]?.activities;
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

        // Validate workspace from the activity
        await validateWorkspace(activity.workspace, ctx.user.id);

        // Validate accounts
        const fromAccount = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, args.fromAccount))
          .limit(1);
        if (!fromAccount) {
          throw new GraphQLError("From account not found");
        }

        const toAccount = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, args.toAccount))
          .limit(1);
        if (!toAccount) {
          throw new GraphQLError("To account not found");
        }

        const newTransactions = await db
          .insert(transactions)
          .values({
            id: args.id,
            user: ctx.user.id,
            amount: args.amount,
            fromAccount: args.fromAccount,
            toAccount: args.toAccount,
            activity: args.activityId,
          })
          .returning();
        const newTransaction = newTransactions[0];

        if (!newTransaction) {
          throw new GraphQLError("Failed to create transaction");
        }

        void addEvent({
          type: "addTransaction",
          payload: {
            activityId: args.activityId,
            ...newTransaction,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: activity.workspace,
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
          type: "String",
          required: true,
        }),
        id: t.arg({
          type: "String",
          required: true,
        }),
        amount: t.arg({
          type: "Float",
          required: false,
        }),
        fromAccount: t.arg({
          type: "String",
          required: false,
        }),
        fromAsset: t.arg({
          type: "String",
          required: false,
        }),
        fromCounterparty: t.arg({
          type: "String",
          required: false,
        }),
        toAccount: t.arg({
          type: "String",
          required: false,
        }),
        toAsset: t.arg({
          type: "String",
          required: false,
        }),
        toCounterparty: t.arg({
          type: "String",
          required: false,
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .innerJoin(activitiesUsers, eq(activities.id, activitiesUsers.activity))
            .where(and(eq(activities.id, args.activityId), eq(activitiesUsers.user, ctx.user.id)))
            .limit(1)
        )[0]?.activities;
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
                eq(transactions.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!transaction) {
          throw new GraphQLError("Transaction not found");
        }

        // TODO: missing validation for accounts, assets and counterparties
        const updatedFields: Partial<typeof transaction> = {};
        if (args.amount !== null) updatedFields.amount = args.amount;
        if (args.fromAccount) updatedFields.fromAccount = args.fromAccount;
        if (args.fromAsset !== undefined) updatedFields.fromAsset = args.fromAsset;
        if (args.fromCounterparty !== undefined)
          updatedFields.fromCounterparty = args.fromCounterparty;
        if (args.toAccount) updatedFields.toAccount = args.toAccount;
        if (args.toAsset !== undefined) updatedFields.toAsset = args.toAsset;
        if (args.toCounterparty !== undefined) updatedFields.toCounterparty = args.toCounterparty;

        const updatedTransactions = await db
          .update(transactions)
          .set(updatedFields)
          .where(eq(transactions.id, args.id))
          .returning();
        const updatedTransaction = updatedTransactions[0];

        if (!updatedTransaction) {
          throw new GraphQLError("Failed to update transaction");
        }

        void addEvent({
          type: "updateTransaction",
          payload: {
            activityId: transaction.activity,
            id: args.id,
            ...updatedFields,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: activity.workspace,
        });

        // Update liabilities if counterparties are defined
        if (
          updatedTransaction.fromCounterparty !== undefined ||
          updatedTransaction.toCounterparty !== undefined
        ) {
          const transactionsData = await db
            .select()
            .from(transactions)
            .where(eq(transactions.activity, args.activityId));

          const counterpartiesData = await db
            .select()
            .from(counterparties)
            .where(eq(counterparties.workspace, activity.workspace));

          const activityUsers = await db
            .select()
            .from(activitiesUsers)
            .where(eq(activitiesUsers.activity, args.activityId));

          activityUsers.forEach((activityUser) => {
            void addEvent({
              type: "updateActivityLiabilities",
              payload: {
                activityId: transaction.activity,
                liabilities: getActivityLiabilities(
                  transactionsData,
                  counterpartiesData,
                  activityUser.user,
                ),
              },
              createdAt: new Date(),
              clientId: ctx.session.id,
              user: activityUser.user,
              workspace: activity.workspace,
            });
          });
        }

        return updatedTransaction;
      },
    }),
  );

  builder.mutationField("deleteTransaction", (t) =>
    t.field({
      type: DeleteTransactionResponseSchema,
      args: {
        activityId: t.arg({
          type: "String",
          required: true,
        }),
        id: t.arg({
          type: "String",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        const activity = (
          await db
            .select()
            .from(activities)
            .innerJoin(activitiesUsers, eq(activities.id, activitiesUsers.activity))
            .where(and(eq(activities.id, args.activityId), eq(activitiesUsers.user, ctx.user.id)))
            .limit(1)
        )[0]?.activities;
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
                eq(transactions.user, ctx.user.id),
              ),
            )
            .limit(1)
        )[0];
        if (!transaction) {
          throw new GraphQLError("Transaction not found");
        }

        await db.delete(transactions).where(eq(transactions.id, args.id));

        void addEvent({
          type: "deleteTransaction",
          payload: {
            activityId: transaction.activity,
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: activity.workspace,
        });

        // Update liabilities if counterparties are defined
        if (transaction.fromCounterparty || transaction.toCounterparty) {
          const transactionsData = await db
            .select()
            .from(transactions)
            .where(eq(transactions.activity, args.activityId));

          const counterpartiesData = await db
            .select()
            .from(counterparties)
            .where(eq(counterparties.workspace, activity.workspace));

          const activityUsers = await db
            .select()
            .from(activitiesUsers)
            .where(eq(activitiesUsers.activity, args.activityId));

          activityUsers.forEach((activityUser) => {
            void addEvent({
              type: "updateActivityLiabilities",
              payload: {
                activityId: transaction.activity,
                liabilities: getActivityLiabilities(
                  transactionsData,
                  counterpartiesData,
                  activityUser.user,
                ),
              },
              createdAt: new Date(),
              clientId: ctx.session.id,
              user: activityUser.user,
              workspace: activity.workspace,
            });
          });
        }

        return { id: args.id, success: true };
      },
    }),
  );

  builder.mutationField("createActivityCategory", (t) =>
    t.field({
      type: ActivityCategorySchema,
      args: {
        id: t.arg({
          type: "String",
        }),
        name: t.arg.string(),
        type: t.arg.string(),
        workspace: t.arg({
          type: "String",
          required: true,
        }),
      },
      resolve: async (root, args, ctx) => {
        // Validate workspace
        await validateWorkspace(args.workspace, ctx.user.id);

        const activityTypeSchema = z.enum(ActivityType);
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
          workspace: args.workspace,
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
          type: "String",
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

        const updatedCategories = await db
          .update(activityCategories)
          .set({
            name: args.name,
          })
          .where(eq(activityCategories.id, args.id))
          .returning();
        const updatedCategory = updatedCategories[0];

        if (!updatedCategory) {
          throw new GraphQLError("Failed to update activity category");
        }

        await addEvent({
          type: "updateActivityCategory",
          payload: {
            id: args.id,
            name: args.name,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: category.workspace,
        });

        return updatedCategory;
      },
    }),
  );

  builder.mutationField("deleteActivityCategory", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "String",
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
          .where(eq(activities.category, args.id));
        await db.delete(activityCategories).where(eq(activityCategories.id, args.id));

        await addEvent({
          type: "deleteActivityCategory",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: category.workspace,
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
          type: "String",
        }),
        name: t.arg.string(),
        category: t.arg({
          type: "String",
        }),
        workspace: t.arg({
          type: "String",
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
          workspace: args.workspace,
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
          type: "String",
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

        const updatedSubCategories = await db
          .update(activitySubcategories)
          .set({
            name: args.name,
          })
          .where(eq(activitySubcategories.id, args.id))
          .returning();
        const updatedSubCategory = updatedSubCategories[0];

        if (!updatedSubCategory) {
          throw new GraphQLError("Failed to update activity subcategory");
        }

        await addEvent({
          type: "updateActivitySubCategory",
          payload: {
            id: args.id,
            name: args.name,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: subcategory.workspace,
        });

        return updatedSubCategory;
      },
    }),
  );

  builder.mutationField("deleteActivitySubCategory", (t) =>
    t.field({
      type: DeleteActivityResponseSchema,
      args: {
        id: t.arg({
          type: "String",
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
        await db.delete(activitySubcategories).where(eq(activitySubcategories.id, args.id));

        await addEvent({
          type: "deleteActivitySubCategory",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.session.id,
          user: ctx.user.id,
          workspace: subCategory.workspace,
        });

        return { id: args.id, success: true };
      },
    }),
  );
};
