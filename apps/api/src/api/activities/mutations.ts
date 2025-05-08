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
  liabilities,
  movements,
  movementsActivities,
  transactions,
} from "@/tables";
import { db } from "@/database";
import { addEvent } from "@/api/events";
import dayjs from "dayjs";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { GraphQLError } from "graphql";
import type { UUID } from "crypto";
import { AccountType } from "@maille/core/accounts";
import type { Liability } from "@maille/core/liabilities";

const TransactionInput = builder.inputType("TransactionInput", {
  fields: (t) => ({
    id: t.field({
      type: "UUID",
    }),
    amount: t.int(),
    fromAccount: t.field({ type: "UUID" }),
    toAccount: t.field({ type: "UUID" }),
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
    amount: t.int(),
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
        const ActivityTypeEnum = z.nativeEnum(ActivityType);
        const activityType = ActivityTypeEnum.parse(args.type);

        const accountsQuery = await db.select().from(accounts);
        const number = await db
          .select({ number: max(activities.number) })
          .from(activities)
          .then(([{ number }]) => number! + 1);

        await db.insert(activities).values({
          id: args.id,
          user: ctx.user,
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
                toAccount: transaction.toAccount,
                activity: args.id,
              })
              .returning()
          )[0];

          newTransactions.push(newTransaction);
        });

        // Liabilities
        const liabilitiesByAccount: { accountId: UUID; amount: number }[] = [];
        args.transactions?.forEach((transaction) => {
          const fromAccount = accountsQuery.find(
            (account) =>
              account.type === AccountType.LIABILITIES &&
              account.id === transaction.fromAccount,
          );
          const toAccount = accountsQuery.find(
            (account) =>
              account.type === AccountType.LIABILITIES &&
              account.id === transaction.toAccount,
          );

          if (fromAccount) {
            const existingLiability = liabilitiesByAccount.find(
              (liability) => liability.accountId === fromAccount.id,
            );
            if (existingLiability) {
              existingLiability.amount -= transaction.amount;
            } else {
              liabilitiesByAccount.push({
                accountId: fromAccount.id,
                amount: -transaction.amount,
              });
            }
          }

          if (toAccount) {
            const existingLiability = liabilitiesByAccount.find(
              (liability) => liability.accountId === toAccount.id,
            );
            if (existingLiability) {
              existingLiability.amount += transaction.amount;
            } else {
              liabilitiesByAccount.push({
                accountId: toAccount.id,
                amount: transaction.amount,
              });
            }
          }
        });

        const activityLiabilities: Liability[] = [];
        liabilitiesByAccount.forEach(async ({ accountId, amount }) => {
          const liability = {
            activity: args.id,
            account: accountId,
            name: args.name,
            date: args.date,
            amount,
            linkId: crypto.randomUUID(),
          };
          activityLiabilities.push({
            ...liability,
            date: dayjs(liability.date),
            status: "completed",
          });
          await db.insert(liabilities).values({
            ...liability,
            user: ctx.user,
          });
        });

        // Movements
        let newMovements: ActivityMovement[] = [];
        if (args.movement) {
          const movementActivity = {
            id: args.movement.id,
            user: ctx.user,
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
            users: [ctx.user],
            name: args.name,
            description: args.description ?? null,
            date: args.date.toISOString(),
            type: activityType,
            category: args.category ?? null,
            subcategory: args.subcategory ?? null,
            project: args.project ?? null,
            transactions: newTransactions,
            movement: args.movement ? { ...args.movement } : undefined,
            liabilities: activityLiabilities,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return {
          id: args.id,
          number,
          users: [ctx.user],
          name: args.name,
          description: args.description ?? null,
          date: dayjs(args.date),
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
            dayjs(args.date),
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
                date: dayjs(movement.date),
                status: "completed",
                activities: [],
              };
            },
          ),
          liabilities: activityLiabilities,
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
              and(eq(activities.id, args.id), eq(activities.user, ctx.user)),
            )
            .limit(1)
        )[0];
        if (!activity) {
          throw new GraphQLError("Activity not found");
        }

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

        if (activityUpdates.name || activityUpdates.date) {
          await db
            .update(liabilities)
            .set({
              name: activityUpdates.name,
              date: activityUpdates.date,
            })
            .where(eq(liabilities.activity, args.id));
        }

        addEvent({
          type: "updateActivity",
          payload: {
            id: args.id,
            ...activityUpdates,
            date: activityUpdates.date?.toISOString(),
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
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
          date: dayjs(updatedActivity.date),
          transactions: transactionsData,
          movements: movementsData,
          amount: getActivityTransactionsReconciliationSum(
            updatedActivity.type,
            transactionsData,
            accountsQuery,
          ),
          status: getActivityStatus(
            dayjs(updatedActivity.date),
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
                date: dayjs(movement.date),
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

        await db.delete(transactions).where(eq(transactions.activity, args.id));
        await db
          .delete(movementsActivities)
          .where(eq(movementsActivities.activity, args.id));
        await db.delete(liabilities).where(eq(liabilities.activity, args.id));
        await db.delete(activities).where(eq(activities.id, args.id));

        await addEvent({
          type: "deleteActivity",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
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
        toAccount: t.arg({ type: "UUID" }),
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
        const newTransaction = (
          await db
            .insert(transactions)
            .values({
              id: args.id,
              amount: args.amount,
              fromAccount: args.fromAccount,
              toAccount: args.toAccount,
              activity: args.activityId,
            })
            .returning()
        )[0];

        // Liabilities
        const transactionLiabilities: Liability[] = [];
        const accountsQuery = await db.select().from(accounts);
        const fromAccount = accountsQuery.find(
          (account) =>
            account.type === AccountType.LIABILITIES &&
            account.id === newTransaction.fromAccount,
        );
        const toAccount = accountsQuery.find(
          (account) =>
            account.type === AccountType.LIABILITIES &&
            account.id === newTransaction.toAccount,
        );

        if (fromAccount) {
          const existingLiability = (
            await db
              .select()
              .from(liabilities)
              .where(
                and(
                  eq(liabilities.account, fromAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, activity.id),
                ),
              )
              .limit(1)
          )[0];
          if (existingLiability) {
            await db
              .update(liabilities)
              .set({
                amount: existingLiability.amount - newTransaction.amount,
              })
              .where(
                and(
                  eq(liabilities.account, fromAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, activity.id),
                ),
              );
            transactionLiabilities.push({
              ...existingLiability,
              date: dayjs(existingLiability.date),
              amount: existingLiability.amount - newTransaction.amount,
              status: "completed",
            });
          } else {
            const liability = {
              linkId: crypto.randomUUID(),
              activity: newTransaction.activity,
              amount: -newTransaction.amount,
              account: fromAccount.id,
              name: activity.name,
              date: activity.date,
            };
            transactionLiabilities.push({
              ...liability,
              date: dayjs(liability.date),
              status: "completed",
            });
            await db.insert(liabilities).values({
              ...liability,
              user: ctx.user,
            });
          }
        }

        if (toAccount) {
          const existingLiability = (
            await db
              .select()
              .from(liabilities)
              .where(
                and(
                  eq(liabilities.account, toAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, activity.id),
                ),
              )
              .limit(1)
          )[0];
          if (existingLiability) {
            await db
              .update(liabilities)
              .set({
                amount: existingLiability.amount + newTransaction.amount,
              })
              .where(
                and(
                  eq(liabilities.account, toAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, activity.id),
                ),
              );
            transactionLiabilities.push({
              ...existingLiability,
              date: dayjs(existingLiability.date),
              amount: existingLiability.amount + newTransaction.amount,
              status: "completed",
            });
          } else {
            const liability = {
              linkId: crypto.randomUUID(),
              activity: newTransaction.activity,
              amount: newTransaction.amount,
              account: toAccount.id,
              name: activity.name,
              date: activity.date,
            };
            transactionLiabilities.push({
              ...liability,
              date: dayjs(liability.date),
              status: "completed",
            });
            await db.insert(liabilities).values({
              ...liability,
              user: ctx.user,
            });
          }
        }

        addEvent({
          type: "addTransaction",
          payload: {
            activityId: args.activityId,
            ...newTransaction,
            liabilities: transactionLiabilities,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return { ...newTransaction, liabilities: transactionLiabilities };
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
        toAccount: t.arg({
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
        if (args.toAccount) updatedFields.toAccount = args.toAccount;

        const updatedTransaction = (
          await db
            .update(transactions)
            .set(updatedFields)
            .where(eq(transactions.id, args.id))
            .returning()
        )[0];

        // Liabilities
        const transactionLiabilities: Liability[] = [];
        const accountsQuery = await db.select().from(accounts);
        const oldFromAccount = accountsQuery.find(
          (account) =>
            account.type === AccountType.LIABILITIES &&
            account.id === transaction.fromAccount,
        );
        const oldToAccount = accountsQuery.find(
          (account) =>
            account.type === AccountType.LIABILITIES &&
            account.id === transaction.toAccount,
        );
        const newFromAccount = accountsQuery.find(
          (account) =>
            account.type === AccountType.LIABILITIES &&
            account.id === updatedTransaction.fromAccount,
        );
        const newToAccount = accountsQuery.find(
          (account) =>
            account.type === AccountType.LIABILITIES &&
            account.id === updatedTransaction.toAccount,
        );

        if (oldFromAccount) {
          const existingLiability = (
            await db
              .select()
              .from(liabilities)
              .where(
                and(
                  eq(liabilities.account, oldFromAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              )
              .limit(1)
          )[0];
          if (existingLiability) {
            await db
              .update(liabilities)
              .set({
                amount: existingLiability.amount + transaction.amount,
              })
              .where(
                and(
                  eq(liabilities.account, oldFromAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              );
          }
        }

        if (oldToAccount) {
          const existingLiability = (
            await db
              .select()
              .from(liabilities)
              .where(
                and(
                  eq(liabilities.account, oldToAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              )
              .limit(1)
          )[0];
          if (existingLiability) {
            await db
              .update(liabilities)
              .set({
                amount: existingLiability.amount - transaction.amount,
              })
              .where(
                and(
                  eq(liabilities.account, oldToAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              );
          }
        }

        if (newFromAccount) {
          const existingLiability = (
            await db
              .select()
              .from(liabilities)
              .where(
                and(
                  eq(liabilities.account, newFromAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              )
              .limit(1)
          )[0];
          if (existingLiability) {
            await db
              .update(liabilities)
              .set({
                amount: existingLiability.amount - updatedTransaction.amount,
              })
              .where(
                and(
                  eq(liabilities.account, newFromAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              );
            transactionLiabilities.push({
              ...existingLiability,
              date: dayjs(existingLiability.date),
              amount: existingLiability.amount - updatedTransaction.amount,
              status: "completed",
            });
          } else {
            const liability = {
              activity: transaction.activity,
              amount: -updatedTransaction.amount,
              account: newFromAccount.id,
              linkId: crypto.randomUUID(),
              name: activity.name,
              date: activity.date,
            };
            transactionLiabilities.push({
              ...liability,
              date: dayjs(liability.date),
              status: "completed",
            });
            await db.insert(liabilities).values({
              ...liability,
              user: ctx.user,
            });
          }
        }

        if (newToAccount) {
          const existingLiability = (
            await db
              .select()
              .from(liabilities)
              .where(
                and(
                  eq(liabilities.account, newToAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              )
              .limit(1)
          )[0];
          if (existingLiability) {
            await db
              .update(liabilities)
              .set({
                amount: existingLiability.amount + updatedTransaction.amount,
              })
              .where(
                and(
                  eq(liabilities.account, newToAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              );
            transactionLiabilities.push({
              ...existingLiability,
              date: dayjs(existingLiability.date),
              amount: existingLiability.amount + updatedTransaction.amount,
              status: "completed",
            });
          } else {
            const liability = {
              activity: transaction.activity,
              amount: updatedTransaction.amount,
              account: newToAccount.id,
              linkId: crypto.randomUUID(),
              name: activity.name,
              date: activity.date,
            };
            transactionLiabilities.push({
              ...liability,
              date: dayjs(liability.date),
              status: "completed",
            });
            await db.insert(liabilities).values({
              ...liability,
              user: ctx.user,
            });
          }
        }

        addEvent({
          type: "updateTransaction",
          payload: {
            activityId: transaction.activity,
            id: args.id,
            ...updatedFields,
            liabilities: transactionLiabilities,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return { ...updatedTransaction, liabilities: transactionLiabilities };
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

        // Liabilities
        const accountsQuery = await db.select().from(accounts);
        const fromAccount = accountsQuery.find(
          (account) =>
            account.type === AccountType.LIABILITIES &&
            account.id === transaction.fromAccount,
        );
        const toAccount = accountsQuery.find(
          (account) =>
            account.type === AccountType.LIABILITIES &&
            account.id === transaction.toAccount,
        );

        if (fromAccount) {
          const existingLiability = (
            await db
              .select()
              .from(liabilities)
              .where(
                and(
                  eq(liabilities.account, fromAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              )
              .limit(1)
          )[0];
          if (existingLiability) {
            await db
              .update(liabilities)
              .set({
                amount: existingLiability.amount + transaction.amount,
              })
              .where(
                and(
                  eq(liabilities.account, fromAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              );
          }
        }

        if (toAccount) {
          const existingLiability = (
            await db
              .select()
              .from(liabilities)
              .where(
                and(
                  eq(liabilities.account, toAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              )
              .limit(1)
          )[0];
          if (existingLiability) {
            await db
              .update(liabilities)
              .set({
                amount: existingLiability.amount - transaction.amount,
              })
              .where(
                and(
                  eq(liabilities.account, toAccount.id),
                  eq(liabilities.user, ctx.user),
                  eq(liabilities.activity, transaction.activity),
                ),
              );
          }
        }

        addEvent({
          type: "deleteTransaction",
          payload: {
            activityId: transaction.activity,
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
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
      },
      resolve: async (root, args, ctx) => {
        const activityTypeSchema = z.nativeEnum(ActivityType);
        const parsedType = activityTypeSchema.parse(args.type);

        const category = {
          id: args.id,
          user: ctx.user,
          name: args.name,
          type: parsedType,
        };
        await db.insert(activityCategories).values(category);

        await addEvent({
          type: "createActivityCategory",
          payload: category,
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
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
            .where(
              and(
                eq(activityCategories.id, args.id),
                eq(activityCategories.user, ctx.user),
              ),
            )
            .limit(1)
        )[0];
        if (!category) {
          throw new GraphQLError("Activity category not found");
        }

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
          clientId: ctx.clientId,
          user: ctx.user,
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
            .where(
              and(
                eq(activityCategories.id, args.id),
                eq(activityCategories.user, ctx.user),
              ),
            )
            .limit(1)
        )[0];
        if (!category) {
          throw new GraphQLError("Activity category not found");
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
              eq(activities.user, ctx.user),
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
          clientId: ctx.clientId,
          user: ctx.user,
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
      },
      resolve: async (root, args, ctx) => {
        const subcategory = {
          id: args.id,
          user: ctx.user,
          name: args.name,
          category: args.category,
        };
        await db.insert(activitySubcategories).values(subcategory);

        await addEvent({
          type: "createActivitySubCategory",
          payload: subcategory,
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
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
            .where(
              and(
                eq(activitySubcategories.id, args.id),
                eq(activitySubcategories.user, ctx.user),
              ),
            )
            .limit(1)
        )[0];
        if (!subcategory) {
          throw new GraphQLError("Activity subcategory not found");
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
          clientId: ctx.clientId,
          user: ctx.user,
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
            .where(
              and(
                eq(activitySubcategories.id, args.id),
                eq(activitySubcategories.user, ctx.user),
              ),
            )
            .limit(1)
        )[0];
        if (!subCategory) {
          throw new GraphQLError("Activity subcategory not found");
        }

        await db
          .update(activities)
          .set({
            subcategory: null,
          })
          .where(
            and(
              eq(activities.subcategory, args.id),
              eq(activities.user, ctx.user),
            ),
          );
        await db
          .delete(activitySubcategories)
          .where(eq(activitySubcategories.id, args.id));

        await addEvent({
          type: "deleteActivitySubCategory",
          payload: {
            id: args.id,
          },
          createdAt: new Date(),
          clientId: ctx.clientId,
          user: ctx.user,
        });

        return { id: args.id, success: true };
      },
    }),
  );
};
