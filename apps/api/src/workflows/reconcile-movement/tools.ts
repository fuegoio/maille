import { db } from "@/database";
import { accounts, activities, transactions } from "@/tables";
import { ActivityType } from "@maille/core/activities";
import { AccountType } from "@maille/core/accounts";
import { extractDateFromMovementName } from "@maille/core/movements";
import { AMOUNT_EPSILON, remainingAmount } from "@maille/core/workflows";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { addEvent } from "@/api/events";
import { createActivity } from "@/services/activities";
import { linkMovementToActivity } from "@/services/movements";
import { findSimilarMovements, searchActivities } from "./evidence";
import {
  AskUserArgs,
  CreateActivityArgs,
  FindSimilarMovementsArgs,
  GiveUpArgs,
  LinkMovementArgs,
  SearchActivitiesArgs,
} from "@maille/workflows/reconcile-movement/tools";
import type { RunState, RunContext, ToolOutcome } from "../types";

/**
 * The reconcile-movement workflow's tool execution. Each tool validates its
 * arguments with a zod schema, performs the side effect, and returns either a
 * result (the loop continues) or `done` (the loop terminates).
 */

const toolError = (message: string) => ({ ok: false as const, error: message });

const workflowClientId = (state: RunState) => `workflow-${state.workflow.user}`;

/** Amount must carry the movement's sign and fit in the remaining allocation. */
const validateAllocation = (
  state: RunState,
  amount: number,
): { ok: true; remaining: number } | { ok: false; error: string } => {
  const remaining = remainingAmount(state.movement.amount, state.linkAmounts);
  if (Math.sign(amount) !== Math.sign(state.movement.amount) || amount === 0) {
    return toolError(
      `Amount must carry the movement's sign (expected ${remaining > 0 ? "positive" : "negative"}), got ${amount}.`,
    );
  }
  if (Math.abs(amount) - Math.abs(remaining) > AMOUNT_EPSILON) {
    return toolError(
      `Amount ${amount} exceeds the remaining allocation (${remaining}). Link a part of it, or askUser if unsure.`,
    );
  }
  return { ok: true, remaining };
};

const resolveAccount = async (userId: string, id: string): Promise<string | null> => {
  const row = (
    await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.user, userId)))
      .limit(1)
  )[0];
  return row?.id ?? null;
};

const firstAccountOfType = async (userId: string, type: AccountType): Promise<string | null> => {
  const row = (
    await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.user, userId), eq(accounts.type, type)))
      .limit(1)
  )[0];
  return row?.id ?? null;
};

/**
 * Builds the transaction legs for a new activity the way the UI does:
 * expense: movement account → expense account, revenue: revenue account →
 * movement account, investment: movement account → investment account,
 * neutral: both legs explicit.
 */
async function buildTransactionLegs(
  state: RunState,
  args: z.infer<typeof CreateActivityArgs>,
): Promise<{ ok: true; fromAccount: string; toAccount: string } | { ok: false; error: string }> {
  const userId = state.workflow.user;
  const movementAccount = state.movement.account;

  if (args.type === ActivityType.EXPENSE) {
    const to = args.toAccount
      ? ((await resolveAccount(userId, args.toAccount)) ?? null)
      : await firstAccountOfType(userId, AccountType.EXPENSE);
    if (!to) {
      return toolError(
        "No expense account found for this user; ask the user how to record this expense.",
      );
    }
    return { ok: true, fromAccount: movementAccount, toAccount: to };
  }

  if (args.type === ActivityType.REVENUE) {
    const from = args.fromAccount
      ? ((await resolveAccount(userId, args.fromAccount)) ?? null)
      : await firstAccountOfType(userId, AccountType.REVENUE);
    if (!from) {
      return toolError(
        "No revenue account found for this user; ask the user how to record this revenue.",
      );
    }
    return { ok: true, fromAccount: from, toAccount: movementAccount };
  }

  if (args.type === ActivityType.INVESTMENT) {
    const to = args.toAccount
      ? ((await resolveAccount(userId, args.toAccount)) ?? null)
      : await firstAccountOfType(userId, AccountType.INVESTMENT_ACCOUNT);
    if (!to) {
      return toolError(
        "No investment account found for this user; ask the user how to record this investment.",
      );
    }
    return { ok: true, fromAccount: movementAccount, toAccount: to };
  }

  if (!args.fromAccount || !args.toAccount) {
    return toolError("Neutral activities need explicit fromAccount and toAccount account ids.");
  }
  const from = await resolveAccount(userId, args.fromAccount);
  const to = await resolveAccount(userId, args.toAccount);
  if (!from || !to) {
    return toolError("Unknown fromAccount or toAccount id.");
  }
  return { ok: true, fromAccount: from, toAccount: to };
}

/**
 * When a movement is linked to an existing activity, the activity's
 * transactions must be adjusted so the activity stays reconciled: the
 * movement total on the movement's account must match the transaction
 * total on that account. We increase the amount of the transaction leg
 * touching the movement's account by the absolute value of the link.
 */
async function adjustTransactionForMovementLink(
  state: RunState,
  activityId: string,
  linkAmount: number,
) {
  const movementAccount = state.movement.account;
  const absLinkAmount = Math.abs(linkAmount);

  // Find the activity's transaction touching the movement's account.
  const activityTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.activity, activityId));

  // A transaction touches the movement's account on either side.
  const matchingTransaction = activityTransactions.find(
    (t) => t.fromAccount === movementAccount || t.toAccount === movementAccount,
  );

  if (!matchingTransaction) {
    return;
  }

  const newAmount = matchingTransaction.amount + absLinkAmount;

  await db
    .update(transactions)
    .set({ amount: newAmount })
    .where(eq(transactions.id, matchingTransaction.id));

  await addEvent({
    type: "updateTransaction",
    payload: {
      activityId,
      id: matchingTransaction.id,
      amount: newAmount,
    },
    createdAt: new Date(),
    clientId: workflowClientId(state),
    user: state.workflow.user,
  });
}

/**
 * Executes a tool call from the model. Side effects (linking movements,
 * creating activities) go through the same services as the GraphQL mutations
 * and the UI, so history, sync events and workflow cancellation all fire.
 */
export async function executeTool(
  state: RunState,
  ctx: RunContext,
  call: { name: string; args: Record<string, unknown> },
): Promise<ToolOutcome> {
  switch (call.name) {
    case "findSimilarMovements": {
      const parsed = FindSimilarMovementsArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for findSimilarMovements") };
      }
      return {
        result: {
          similarMovements: await findSimilarMovements(
            state.workflow.user,
            parsed.data.name,
            state.movement.id,
          ),
        },
      };
    }

    case "searchActivities": {
      const parsed = SearchActivitiesArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for searchActivities") };
      }
      let fromDate: Date | undefined;
      let toDate: Date | undefined;
      try {
        fromDate = parsed.data.fromDate ? new Date(parsed.data.fromDate) : undefined;
        toDate = parsed.data.toDate ? new Date(parsed.data.toDate) : undefined;
      } catch {
        return { result: toolError("Invalid date argument") };
      }
      if (
        (fromDate && Number.isNaN(fromDate.getTime())) ||
        (toDate && Number.isNaN(toDate.getTime()))
      ) {
        return { result: toolError("Invalid date argument") };
      }
      return {
        result: {
          activities: await searchActivities(
            state.workflow.user,
            {
              name: parsed.data.name,
              fromDate,
              toDate,
            },
            await db
              .select({
                id: accounts.id,
                name: accounts.name,
                type: accounts.type,
                movements: accounts.movements,
              })
              .from(accounts)
              .where(eq(accounts.user, state.workflow.user)),
          ),
        },
      };
    }

    case "linkMovement": {
      const parsed = LinkMovementArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for linkMovement") };
      }
      const allocation = validateAllocation(state, parsed.data.amount);
      if (!allocation.ok) {
        return { result: allocation };
      }
      const activity = (
        await db
          .select({ id: activities.id })
          .from(activities)
          .where(
            and(
              eq(activities.id, parsed.data.activityId),
              eq(activities.user, state.workflow.user),
            ),
          )
          .limit(1)
      )[0];
      if (!activity) {
        return { result: toolError(`Activity ${parsed.data.activityId} does not exist`) };
      }

      await linkMovementToActivity(state.workflow.user, workflowClientId(state), {
        id: crypto.randomUUID(),
        movementId: state.movement.id,
        activityId: activity.id,
        amount: parsed.data.amount,
      });

      // Adjust the activity's transaction so the activity stays reconciled
      // after adding the new movement link.
      await adjustTransactionForMovementLink(state, activity.id, parsed.data.amount);

      state.linkAmounts.push(parsed.data.amount);
      state.linkedActivities.push(activity.id);
      const remaining = remainingAmount(state.movement.amount, state.linkAmounts);
      if (remaining === 0) {
        return { done: true };
      }
      return {
        result: { ok: true, linked: true, remainingToAllocate: remaining },
      };
    }

    case "createActivity": {
      const parsed = CreateActivityArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for createActivity") };
      }
      const allocation = validateAllocation(state, parsed.data.amount);
      if (!allocation.ok) {
        return { result: allocation };
      }
      const legs = await buildTransactionLegs(state, parsed.data);
      if (!legs.ok) {
        return { result: legs };
      }

      const created = await createActivity(state.workflow.user, workflowClientId(state), {
        id: crypto.randomUUID(),
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        date: extractDateFromMovementName(state.movement.name) ?? state.movement.date,
        type: parsed.data.type,
        category: parsed.data.category ?? null,
        subcategory: parsed.data.subcategory ?? null,
        transactions: [
          {
            id: crypto.randomUUID(),
            amount: Math.abs(parsed.data.amount),
            fromAccount: legs.fromAccount,
            toAccount: legs.toAccount,
          },
        ],
        movement: {
          id: crypto.randomUUID(),
          movement: state.movement.id,
          amount: parsed.data.amount,
        },
      });

      state.linkAmounts.push(parsed.data.amount);
      state.createdActivities.push(created.id);
      const remaining = remainingAmount(state.movement.amount, state.linkAmounts);
      if (remaining === 0) {
        return { done: true };
      }
      return {
        result: { ok: true, created: created.id, remainingToAllocate: remaining },
      };
    }

    case "askUser": {
      const parsed = AskUserArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for askUser") };
      }
      await ctx.pauseForQuestion(parsed.data.question, parsed.data.options);
      return { done: true };
    }

    case "giveUp": {
      const parsed = GiveUpArgs.safeParse(call.args);
      if (!parsed.success) {
        return { result: toolError("Invalid arguments for giveUp") };
      }
      const reason = parsed.data.reason ?? "No clue what this movement is";
      await ctx.finishFailed("model_give_up", reason, reason);
      return { done: true };
    }

    default:
      return { result: toolError(`Unknown tool ${call.name}`) };
  }
}

/** Human-readable description of a tool call, used when the LLM sent no narration. */
export const describeToolCall = (call: {
  name: string;
  args: Record<string, unknown>;
}): string | null => {
  switch (call.name) {
    case "findSimilarMovements":
      return "Looking for similar movements...";
    case "searchActivities":
      return "Searching existing activities...";
    case "linkMovement":
      return "Linking to an existing activity...";
    case "createActivity": {
      const name = call.args.name;
      return typeof name === "string"
        ? `Creating activity '${name}'...`
        : "Creating a new activity...";
    }
    default:
      return null;
  }
};

const activityNames = async (userId: string, ids: string[]): Promise<Map<string, string>> => {
  const names = new Map<string, string>();
  for (const id of ids) {
    const row = (
      await db
        .select({ id: activities.id, name: activities.name })
        .from(activities)
        .where(and(eq(activities.id, id), eq(activities.user, userId)))
        .limit(1)
    )[0];
    if (row) {
      names.set(row.id, row.name);
    }
  }
  return names;
};

/** Summary of the run's outcome, shown to the user as the final assistant message. */
export const resultSummary = async (state: RunState): Promise<string> => {
  const created = await activityNames(state.workflow.user, state.createdActivities);
  const linked = await activityNames(state.workflow.user, state.linkedActivities);
  const parts: string[] = [];
  if (state.createdActivities.length) {
    parts.push(
      `created ${state.createdActivities.map((id) => `'${created.get(id) ?? id}'`).join(", ")}`,
    );
  }
  if (state.linkedActivities.length) {
    parts.push(
      `linked to ${state.linkedActivities.map((id) => `'${linked.get(id) ?? id}'`).join(", ")}`,
    );
  }
  return `Movement fully allocated: I ${parts.join(" and ")}.`;
};
