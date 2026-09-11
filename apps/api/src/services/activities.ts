import {
  ActivityType,
  getActivitySharingsReconciliation,
  getActivityStatus,
  getActivityTransactionsReconciliationSum,
  type ActivityMovement,
} from "@maille/core/activities";
import { buildCreateEntry, buildLinkEntry, diffActivity } from "@maille/core/history";
import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { z } from "zod";
import { db } from "@/database";
import {
  accounts,
  activities,
  activityCategories,
  activitySubcategories,
  assets,
  counterparties,
  movements,
  movementsActivities,
  projects,
  transactions,
} from "@/tables";
import { idPattern } from "@/api/idPrefix";
import { addEvent } from "@/api/events";
import { computeHistory, emitHistoryEvents } from "@/api/history/history";
import { loadHistoryLabels } from "@/api/history/labels";
import { getActivitySharings } from "@/services/sharing";
import { insertTransactionFundMoves, serializeFundMoves } from "@/api/funds/transactions";
import type { FundMoveInput } from "@/api/funds/types";
import { cancelWorkflowIfActive, workflowClientId } from "@/workflows/store";

export type TransactionInputArgs = {
  id: string;
  amount: number;
  fromAccount: string;
  fromAsset?: string | null;
  fromCounterparty?: string | null;
  toAccount: string;
  toAsset?: string | null;
  toCounterparty?: string | null;
  fundMoves?: FundMoveInput[] | null;
};

export type ActivityMovementInputArgs = {
  id: string;
  movement: string;
  amount: number;
};

export type CreateActivityArgs = {
  id: string;
  name: string;
  description?: string | null;
  date: Date;
  type: string;
  category?: string | null;
  subcategory?: string | null;
  project?: string | null;
  transactions?: TransactionInputArgs[] | null;
  movement?: ActivityMovementInputArgs | null;
};

/**
 * Creates an activity with its transactions and optional movement link. The
 * canonical implementation shared by the `createActivity` GraphQL mutation
 * and the AI workflows, so both go through the same history, sync events and
 * workflow hooks.
 */
export async function createActivity(userId: string, clientId: string, args: CreateActivityArgs) {
  const writer = { user: { id: userId }, session: { id: clientId } };

  const ActivityTypeEnum = z.enum(ActivityType);
  const activityType = ActivityTypeEnum.parse(args.type);

  const accountsQuery = await db.select().from(accounts).where(eq(accounts.user, userId));

  const category = args.category
    ? ((
        await db
          .select({ id: activityCategories.id })
          .from(activityCategories)
          .where(
            and(
              like(activityCategories.id, idPattern(args.category)),
              eq(activityCategories.user, userId),
            ),
          )
          .limit(1)
      )[0]?.id ?? null)
    : args.category;
  const subcategory = args.subcategory
    ? ((
        await db
          .select({ id: activitySubcategories.id })
          .from(activitySubcategories)
          .where(
            and(
              like(activitySubcategories.id, idPattern(args.subcategory)),
              eq(activitySubcategories.user, userId),
            ),
          )
          .limit(1)
      )[0]?.id ?? null)
    : args.subcategory;
  const project = args.project
    ? ((
        await db
          .select({ id: projects.id })
          .from(projects)
          .where(and(like(projects.id, idPattern(args.project)), eq(projects.user, userId)))
          .limit(1)
      )[0]?.id ?? null)
    : args.project;

  const createHistory = computeHistory(writer, [], [buildCreateEntry("activity", args.id)]);

  await db.insert(activities).values({
    id: args.id,
    user: userId,
    name: args.name,
    description: args.description,
    date: new Date(args.date),
    type: activityType,
    category,
    subcategory,
    project,
    history: createHistory.history,
  });

  // Transactions
  const transactionPromises =
    args.transactions?.map(async (transaction) => {
      const fromAccount =
        (
          await db
            .select({ id: accounts.id })
            .from(accounts)
            .where(
              and(like(accounts.id, idPattern(transaction.fromAccount)), eq(accounts.user, userId)),
            )
            .limit(1)
        )[0]?.id ?? transaction.fromAccount;
      const toAccount =
        (
          await db
            .select({ id: accounts.id })
            .from(accounts)
            .where(
              and(like(accounts.id, idPattern(transaction.toAccount)), eq(accounts.user, userId)),
            )
            .limit(1)
        )[0]?.id ?? transaction.toAccount;
      const fromAsset = transaction.fromAsset
        ? (
            await db
              .select({ id: assets.id })
              .from(assets)
              .where(
                and(like(assets.id, idPattern(transaction.fromAsset)), eq(assets.user, userId)),
              )
              .limit(1)
          )[0]?.id
        : transaction.fromAsset;
      const toAsset = transaction.toAsset
        ? (
            await db
              .select({ id: assets.id })
              .from(assets)
              .where(and(like(assets.id, idPattern(transaction.toAsset)), eq(assets.user, userId)))
              .limit(1)
          )[0]?.id
        : transaction.toAsset;
      const fromCounterparty = transaction.fromCounterparty
        ? (
            await db
              .select({ id: counterparties.id })
              .from(counterparties)
              .where(
                and(
                  like(counterparties.id, idPattern(transaction.fromCounterparty)),
                  eq(counterparties.user, userId),
                ),
              )
              .limit(1)
          )[0]?.id
        : transaction.fromCounterparty;
      const toCounterparty = transaction.toCounterparty
        ? (
            await db
              .select({ id: counterparties.id })
              .from(counterparties)
              .where(
                and(
                  like(counterparties.id, idPattern(transaction.toCounterparty)),
                  eq(counterparties.user, userId),
                ),
              )
              .limit(1)
          )[0]?.id
        : transaction.toCounterparty;
      const transactionResults = await db
        .insert(transactions)
        .values({
          id: transaction.id,
          amount: transaction.amount,
          fromAccount,
          toAccount,
          fromAsset,
          toAsset,
          fromCounterparty,
          toCounterparty,
          activity: args.id,
        })
        .returning();
      const newTransaction = transactionResults[0];

      if (!newTransaction) {
        throw new GraphQLError("Failed to create transaction");
      }

      const newFundMoves = await insertTransactionFundMoves({
        userId,
        transactionId: newTransaction.id,
        transactionDate: new Date(args.date),
        amount: transaction.amount,
        fromAccount,
        toAccount,
        fundMovesInput: transaction.fundMoves,
      });

      return { ...newTransaction, fundMoves: newFundMoves };
    }) || [];

  const newTransactions = await Promise.all(transactionPromises);

  // Movements
  let newMovements: ActivityMovement[] = [];
  let movementHistoryResult: ReturnType<typeof computeHistory> | null = null;
  if (args.movement) {
    const movementRow =
      (
        await db
          .select()
          .from(movements)
          .where(
            and(like(movements.id, idPattern(args.movement.movement)), eq(movements.user, userId)),
          )
          .limit(1)
      )[0] ?? null;
    const resolvedMovement = movementRow?.id ?? args.movement.movement;
    const movementActivity = {
      id: args.movement.id,
      user: userId,
      activity: args.id,
      movement: resolvedMovement,
      amount: args.movement.amount,
    };
    await db.insert(movementsActivities).values(movementActivity);
    newMovements = [movementActivity];

    // History: link entry on the linked movement's timeline.
    if (movementRow) {
      movementHistoryResult = computeHistory(writer, movementRow.history, [
        buildLinkEntry(
          "movement",
          movementRow.id,
          { type: "activity", id: args.id, label: args.name },
          args.movement.amount,
        ),
      ]);
      await db
        .update(movements)
        .set({ history: movementHistoryResult.history })
        .where(eq(movements.id, movementRow.id));

      // AI workflows: reconciling by hand cancels the movement's active
      // workflow. Links made by the workflow itself do not.
      if (clientId !== workflowClientId(userId)) {
        await cancelWorkflowIfActive(userId, movementRow.id, clientId);
      }
    }
  }

  await addEvent({
    type: "createActivity",
    payload: {
      id: args.id,
      name: args.name,
      description: args.description ?? null,
      date: new Date(args.date).toISOString(),
      type: activityType,
      category: category ?? null,
      subcategory: subcategory ?? null,
      project: project ?? null,
      transactions: newTransactions.map((transaction) => ({
        ...transaction,
        fundMoves: serializeFundMoves(transaction.fundMoves),
      })),
      movement:
        args.movement && newMovements[0]
          ? {
              id: args.movement.id,
              amount: args.movement.amount,
              movement: newMovements[0].movement,
            }
          : undefined,
    },
    createdAt: new Date(),
    clientId,
    user: userId,
  });
  await emitHistoryEvents(writer, createHistory.emitted);
  await emitHistoryEvents(writer, movementHistoryResult?.emitted ?? []);

  const userMovements = await db.select().from(movements).where(eq(movements.user, userId));

  return {
    id: args.id,
    users: [userId],
    name: args.name,
    description: args.description ?? null,
    date: args.date,
    type: activityType,
    category: category ?? null,
    subcategory: subcategory ?? null,
    project: project ?? null,
    transactions: newTransactions,
    movements: newMovements,
    history: createHistory.history,
    amount: getActivityTransactionsReconciliationSum(activityType, newTransactions, accountsQuery),
    status: getActivityStatus(args.date, newTransactions, newMovements, accountsQuery, (id) => {
      const movement = userMovements.find((m) => m.id === id);
      if (!movement) return;
      return {
        ...movement,
        date: movement.date,
        status: "completed",
        activities: [],
      };
    }),
    sharing: getActivitySharingsReconciliation(await getActivitySharings(args.id, userId), userId),
  };
}

export type UpdateActivityArgs = {
  id: string;
  name?: string | null;
  description?: string | null;
  date?: Date | null;
  type?: string | null;
  category?: string | null;
  subcategory?: string | null;
  project?: string | null;
};

/**
 * Updates an activity's fields. The canonical implementation shared by the
 * `updateActivity` GraphQL mutation and the AI workflows, so both go through
 * the same history, sync events and workflow hooks.
 */
export async function updateActivity(userId: string, clientId: string, args: UpdateActivityArgs) {
  const writer = { user: { id: userId }, session: { id: clientId } };

  let activity = (
    await db
      .select()
      .from(activities)
      .where(and(like(activities.id, idPattern(args.id)), eq(activities.user, userId)))
      .limit(1)
  )[0];
  if (!activity) {
    throw new GraphQLError("Activity not found");
  }

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
    activityUpdates.category = args.category
      ? ((
          await db
            .select({ id: activityCategories.id })
            .from(activityCategories)
            .where(
              and(
                like(activityCategories.id, idPattern(args.category)),
                eq(activityCategories.user, userId),
              ),
            )
            .limit(1)
        )[0]?.id ?? null)
      : args.category;
    activityUpdates.subcategory = null;
  }
  if (args.subcategory !== undefined) {
    activityUpdates.subcategory = args.subcategory
      ? ((
          await db
            .select({ id: activitySubcategories.id })
            .from(activitySubcategories)
            .where(
              and(
                like(activitySubcategories.id, idPattern(args.subcategory)),
                eq(activitySubcategories.user, userId),
              ),
            )
            .limit(1)
        )[0]?.id ?? null)
      : args.subcategory;
  }
  if (args.project !== undefined) {
    activityUpdates.project = args.project
      ? ((
          await db
            .select({ id: projects.id })
            .from(projects)
            .where(and(like(projects.id, idPattern(args.project)), eq(projects.user, userId)))
            .limit(1)
        )[0]?.id ?? null)
      : args.project;
  }

  // History: derive the diff from the before/after rows.
  const labels = await loadHistoryLabels(userId);
  const after = { ...activity, ...activityUpdates };
  const changes = diffActivity(
    {
      name: activity.name,
      description: activity.description,
      date: activity.date.toISOString(),
      type: activity.type,
      category: activity.category
        ? { id: activity.category, label: labels.category(activity.category) }
        : null,
      subcategory: activity.subcategory
        ? {
            id: activity.subcategory,
            label: labels.subcategory(activity.subcategory),
          }
        : null,
      project: activity.project
        ? { id: activity.project, label: labels.project(activity.project) }
        : null,
    },
    {
      name: after.name,
      description: after.description,
      date: after.date.toISOString(),
      type: after.type,
      category: after.category
        ? { id: after.category, label: labels.category(after.category) }
        : null,
      subcategory: after.subcategory
        ? {
            id: after.subcategory,
            label: labels.subcategory(after.subcategory),
          }
        : null,
      project: after.project ? { id: after.project, label: labels.project(after.project) } : null,
    },
  );
  const historyResult =
    changes.length > 0
      ? computeHistory(writer, activity.history, [
          {
            entityType: "activity",
            entityId: activity.id,
            action: "update",
            changes,
          },
        ])
      : null;

  if (Object.keys(activityUpdates).length > 0) {
    const updatedActivities = await db
      .update(activities)
      .set({
        ...activityUpdates,
        ...(historyResult ? { history: historyResult.history } : {}),
      })
      .where(eq(activities.id, activity.id))
      .returning();
    activity = updatedActivities[0];
    if (!activity) {
      throw new GraphQLError("Failed to update activity");
    }
  }

  await addEvent({
    type: "updateActivity",
    payload: {
      id: activity.id,
      ...activityUpdates,
      date: activityUpdates.date?.toISOString(),
    },
    createdAt: new Date(),
    clientId,
    user: userId,
  });
  if (historyResult) {
    await emitHistoryEvents(writer, historyResult.emitted);
  }

  const accountsQuery = await db.select().from(accounts);
  const transactionsData = await db
    .select()
    .from(transactions)
    .where(eq(transactions.activity, activity.id));
  const movementsData = await db
    .select()
    .from(movementsActivities)
    .where(eq(movementsActivities.activity, activity.id));

  const userMovements = await db.select().from(movements).where(eq(movements.user, userId));

  return {
    ...activity,
    date: activity.date,
    transactions: transactionsData,
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
        const movement = userMovements.find((m) => m.id === id);
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
      await getActivitySharings(activity.id, userId),
      userId,
    ),
  };
}
