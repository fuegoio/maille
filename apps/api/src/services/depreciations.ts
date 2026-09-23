import {
  AccountType,
  depreciationActivityName,
  depreciationInstallments,
  depreciationMonthKey,
  isDepreciationManaged,
  type AssetDepreciation,
} from "@maille/core/accounts";

import { and, eq, like } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { addEvent } from "@/api/events";
import { idPattern } from "@/api/idPrefix";
import { db } from "@/database";
import { accounts, activities, assetDepreciations, assets, transactions } from "@/tables";
import {
  createActivity,
  deleteActivity,
  updateActivity,
  updateTransaction,
} from "@/services/activities";

export type CreateAssetDepreciationArgs = {
  id: string;
  asset: string;
  method: "linear";
  basis: number;
  months: number;
  /** The 1st of the first depreciated month. */
  startMonth: Date;
  expenseAccount: string;
  category?: string | null;
  subcategory?: string | null;
};

export type UpdateAssetDepreciationArgs = {
  id: string;
  basis?: number;
  months?: number;
  startMonth?: Date;
  expenseAccount?: string;
  category?: string | null;
  subcategory?: string | null;
};

/**
 * Stable client id for everything the schedule generator writes (sync
 * events, history entries): deterministic across runs, and distinct from
 * the caller's session so every client — including the one that made the
 * change — applies the generated rows from the event stream instead of
 * expecting an optimistic local copy it never made.
 */
const depreciationClientId = (userId: string) => `depreciation-${userId}`;

/** The plan as the sync events carry it: dates serialized to ISO strings. */
export const serializeAssetDepreciation = (
  plan: AssetDepreciation,
): {
  id: string;
  asset: string;
  method: "linear";
  basis: number;
  months: number;
  startMonth: string;
  expenseAccount: string;
  category: string | null;
  subcategory: string | null;
} => ({
  id: plan.id,
  asset: plan.asset,
  method: plan.method,
  basis: plan.basis,
  months: plan.months,
  startMonth: plan.startMonth.toISOString(),
  expenseAccount: plan.expenseAccount,
  category: plan.category,
  subcategory: plan.subcategory,
});

const loadAsset = async (userId: string, assetId: string) => {
  const asset = (
    await db
      .select()
      .from(assets)
      .where(and(like(assets.id, idPattern(assetId)), eq(assets.user, userId)))
      .limit(1)
  )[0];
  if (!asset) {
    throw new GraphQLError("Asset not found");
  }
  return asset;
};

const loadExpenseAccount = async (userId: string, accountId: string) => {
  const account = (
    await db
      .select()
      .from(accounts)
      .where(and(like(accounts.id, idPattern(accountId)), eq(accounts.user, userId)))
      .limit(1)
  )[0];
  if (!account) {
    throw new GraphQLError("Account not found");
  }
  if (account.type !== AccountType.EXPENSE) {
    throw new GraphQLError("The depreciation expense account must be an Expense account");
  }
  return account;
};

const validateSchedule = (basis: number, months: number) => {
  if (!(basis > 0)) {
    throw new GraphQLError("The depreciation basis must be positive");
  }
  if (!Number.isInteger(months) || months < 1) {
    throw new GraphQLError("The depreciation duration must be at least one month");
  }
};

/** The 1st of the month at local midnight, the canonical installment date. */
const normalizeStartMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

/**
 * Creates the schedule and generates its activities: one per month on the
 * 1st, each a single leg from the asset's account (the asset itself) to
 * the plan's expense account. Generation goes through the canonical
 * activity service, so history and sync events flow like any other
 * activity.
 */
export async function createAssetDepreciation(
  userId: string,
  clientId: string,
  args: CreateAssetDepreciationArgs,
) {
  const asset = await loadAsset(userId, args.asset);
  await loadExpenseAccount(userId, args.expenseAccount);
  validateSchedule(args.basis, args.months);

  const existing = (
    await db.select().from(assetDepreciations).where(eq(assetDepreciations.asset, asset.id))
  )[0];
  if (existing) {
    throw new GraphQLError("This asset already has a depreciation schedule");
  }

  const plan = (
    await db
      .insert(assetDepreciations)
      .values({
        id: args.id,
        user: userId,
        asset: asset.id,
        method: args.method,
        basis: args.basis,
        months: args.months,
        startMonth: normalizeStartMonth(args.startMonth),
        expenseAccount: args.expenseAccount,
        category: args.category ?? null,
        subcategory: args.subcategory ?? null,
      })
      .returning()
  )[0];
  if (!plan) {
    throw new GraphQLError("Failed to create the depreciation schedule");
  }

  const generatorId = depreciationClientId(userId);
  for (const installment of depreciationInstallments(plan)) {
    await generateInstallment(userId, generatorId, plan, asset, installment);
  }

  await addEvent({
    type: "createAssetDepreciation",
    payload: serializeAssetDepreciation(plan),
    createdAt: new Date(),
    clientId,
    user: userId,
  });

  return plan;
}

/**
 * Updates the schedule, then reconciles its generated activities with the
 * new plan: the plan owns every linked activity dated today or later —
 * those are updated, created or deleted to match — while past ones stay
 * frozen history.
 */
export async function updateAssetDepreciation(
  userId: string,
  clientId: string,
  args: UpdateAssetDepreciationArgs,
) {
  const plan = await loadPlan(userId, args.id);
  const asset = await loadAsset(userId, plan.asset);

  const updates: Partial<typeof plan> = {};
  if (args.basis !== undefined) updates.basis = args.basis;
  if (args.months !== undefined) updates.months = args.months;
  if (args.startMonth !== undefined) updates.startMonth = normalizeStartMonth(args.startMonth);
  if (args.expenseAccount !== undefined) {
    await loadExpenseAccount(userId, args.expenseAccount);
    updates.expenseAccount = args.expenseAccount;
  }
  if (args.category !== undefined) updates.category = args.category;
  if (args.subcategory !== undefined) updates.subcategory = args.subcategory;

  validateSchedule(updates.basis ?? plan.basis, updates.months ?? plan.months);

  const updatedPlan = (
    await db
      .update(assetDepreciations)
      .set(updates)
      .where(eq(assetDepreciations.id, plan.id))
      .returning()
  )[0];
  if (!updatedPlan) {
    throw new GraphQLError("Failed to update the depreciation schedule");
  }

  await regenerateSchedule(userId, depreciationClientId(userId), updatedPlan, asset);

  await addEvent({
    type: "updateAssetDepreciation",
    payload: {
      id: updatedPlan.id,
      ...updates,
      startMonth: updates.startMonth?.toISOString(),
    },
    createdAt: new Date(),
    clientId,
    user: userId,
  });

  return updatedPlan;
}

/**
 * Deletes the schedule: its future activities go with it, past ones stay
 * as ordinary ledger rows with their depreciation provenance cleared.
 */
export async function deleteAssetDepreciation(userId: string, clientId: string, id: string) {
  const plan = await loadPlan(userId, id);

  const linked = await db.select().from(activities).where(eq(activities.depreciation, plan.id));

  for (const activity of linked) {
    if (isDepreciationManaged(activity.date)) {
      await deleteActivity(userId, depreciationClientId(userId), activity.id);
    } else {
      await db.update(activities).set({ depreciation: null }).where(eq(activities.id, activity.id));
      await addEvent({
        type: "updateActivity",
        payload: {
          id: activity.id,
          depreciation: null,
        },
        createdAt: new Date(),
        clientId,
        user: userId,
      });
    }
  }

  await db.delete(assetDepreciations).where(eq(assetDepreciations.id, plan.id));

  await addEvent({
    type: "deleteAssetDepreciation",
    payload: {
      id: plan.id,
    },
    createdAt: new Date(),
    clientId,
    user: userId,
  });

  return {
    id: plan.id,
    success: true,
  };
}

async function loadPlan(userId: string, id: string) {
  const plan = (
    await db
      .select()
      .from(assetDepreciations)
      .where(and(like(assetDepreciations.id, idPattern(id)), eq(assetDepreciations.user, userId)))
      .limit(1)
  )[0];
  if (!plan) {
    throw new GraphQLError("Depreciation schedule not found");
  }
  return plan;
}

/** One generated activity: a single leg out of the asset, to the expense account. */
async function generateInstallment(
  userId: string,
  clientId: string,
  plan: AssetDepreciation,
  asset: { id: string; account: string; name: string },
  installment: { date: Date; amount: number },
) {
  await createActivity(userId, clientId, {
    id: crypto.randomUUID(),
    name: depreciationActivityName(asset.name),
    date: installment.date,
    category: plan.category,
    subcategory: plan.subcategory,
    depreciation: plan.id,
    transactions: [
      {
        id: crypto.randomUUID(),
        amount: installment.amount,
        fromAccount: asset.account,
        fromAsset: asset.id,
        fromCounterparty: null,
        toAccount: plan.expenseAccount,
        toAsset: null,
        toCounterparty: null,
      },
    ],
  });
}

/**
 * Brings the plan's generated activities in line with the plan: future
 * months are updated in place (same activity ids, so links and history
 * survive), missing months are created, and months the plan no longer
 * covers are deleted. Past activities are never touched.
 */
async function regenerateSchedule(
  userId: string,
  clientId: string,
  plan: AssetDepreciation,
  asset: { id: string; account: string; name: string },
) {
  const linked = await db
    .select()
    .from(activities)
    .where(and(eq(activities.depreciation, plan.id), eq(activities.user, userId)));

  const byMonth = new Map(
    linked.map((activity) => [depreciationMonthKey(activity.date), activity]),
  );

  const desired = depreciationInstallments(plan).filter((installment) =>
    isDepreciationManaged(installment.date),
  );

  for (const installment of desired) {
    const existing = byMonth.get(depreciationMonthKey(installment.date));
    if (existing) {
      await updateActivity(userId, clientId, {
        id: existing.id,
        name: depreciationActivityName(asset.name),
        date: installment.date,
        category: plan.category,
        subcategory: plan.subcategory,
      });

      // The generated leg: the one leaving the asset, falling back to the
      // activity's first leg if the user reshaped the activity by hand.
      const activityTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.activity, existing.id));
      const leg =
        activityTransactions.find((transaction) => transaction.fromAsset === asset.id) ??
        activityTransactions[0];
      if (leg) {
        await updateTransaction(userId, clientId, {
          activityId: existing.id,
          id: leg.id,
          amount: installment.amount,
          fromAccount: asset.account,
          fromAsset: asset.id,
          toAccount: plan.expenseAccount,
        });
      }
    } else {
      await generateInstallment(userId, clientId, plan, asset, installment);
    }
  }

  const desiredMonths = new Set(
    desired.map((installment) => depreciationMonthKey(installment.date)),
  );
  for (const activity of linked) {
    if (
      !desiredMonths.has(depreciationMonthKey(activity.date)) &&
      isDepreciationManaged(activity.date)
    ) {
      await deleteActivity(userId, clientId, activity.id);
    }
  }
}
