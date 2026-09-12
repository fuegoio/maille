import { db } from "@/database";
import {
  accounts,
  activities,
  activityCategories,
  activitySubcategories,
  counterparties,
  funds,
  movements,
  movementsActivities,
  projects,
  transactions,
} from "@/tables";
import { and, asc, desc, eq, gte, ilike, lte, ne } from "drizzle-orm";
import type { Movement } from "@maille/core/movements";
import { getActivityMovementsReconciliated } from "@maille/core/activities";
import type {
  Evidence,
  EvidenceActivity,
  EvidenceSimilarMovement,
} from "@maille/workflows/reconcile-movement/evidence";

/**
 * The evidence pack queries: deterministic database reads assembled before
 * the first LLM call, so the model starts from grounded history instead of
 * guessing. The data shapes live in @maille/workflows.
 */

const SIMILAR_MOVEMENTS_LIMIT = 10;
const ACTIVITY_NAME_MATCHES_LIMIT = 5;
const DATE_WINDOW_ACTIVITIES_LIMIT = 10;
const DATE_WINDOW_DAYS = 7;

/**
 * Movements with a name matching `name` (case-insensitive substring),
 * carrying how each of them was linked historically — the strongest
 * reconciliation signal.
 */
export async function findSimilarMovements(
  userId: string,
  name: string,
  excludeMovementId?: string,
): Promise<EvidenceSimilarMovement[]> {
  const rows = await db
    .select({
      movementId: movements.id,
      movementName: movements.name,
      movementAmount: movements.amount,
      movementDate: movements.date,
      linkAmount: movementsActivities.amount,
      activityId: activities.id,
      activityName: activities.name,
    })
    .from(movements)
    .leftJoin(movementsActivities, eq(movementsActivities.movement, movements.id))
    .leftJoin(activities, eq(activities.id, movementsActivities.activity))
    .where(
      and(
        eq(movements.user, userId),
        ilike(movements.name, `%${name}%`),
        excludeMovementId ? ne(movements.id, excludeMovementId) : undefined,
      ),
    )
    .orderBy(desc(movements.date))
    .limit(SIMILAR_MOVEMENTS_LIMIT * 3);

  const byMovement = new Map<string, EvidenceSimilarMovement>();
  for (const row of rows) {
    let movement = byMovement.get(row.movementId);
    if (!movement) {
      movement = {
        id: row.movementId,
        name: row.movementName,
        amount: row.movementAmount,
        date: row.movementDate.toISOString(),
        links: [],
      };
      byMovement.set(row.movementId, movement);
    }
    if (row.activityId && row.activityName) {
      movement.links.push({
        activityId: row.activityId,
        activityName: row.activityName,
        amount: row.linkAmount ?? 0,
      });
    }
  }
  return [...byMovement.values()].slice(0, SIMILAR_MOVEMENTS_LIMIT);
}

type SimpleAccount = { id: string; type: string; movements: boolean };

/**
 * Activities matching an optional name pattern and/or date window, with
 * their transactions and linked movements.
 */
export async function searchActivities(
  userId: string,
  filters: { name?: string; fromDate?: Date; toDate?: Date; limit?: number },
  allAccounts: SimpleAccount[],
): Promise<EvidenceActivity[]> {
  const conditions = [eq(activities.user, userId)];
  if (filters.name) {
    conditions.push(ilike(activities.name, `%${filters.name}%`));
  }
  if (filters.fromDate) {
    conditions.push(gte(activities.date, filters.fromDate));
  }
  if (filters.toDate) {
    conditions.push(lte(activities.date, filters.toDate));
  }

  const activityRows = await db
    .select({
      id: activities.id,
      name: activities.name,
      date: activities.date,
      category: activityCategories.name,
      subcategory: activitySubcategories.name,
    })
    .from(activities)
    .leftJoin(activityCategories, eq(activityCategories.id, activities.category))
    .leftJoin(activitySubcategories, eq(activitySubcategories.id, activities.subcategory))
    .where(and(...conditions))
    .orderBy(desc(activities.date))
    .limit(filters.limit ?? DATE_WINDOW_ACTIVITIES_LIMIT);

  return Promise.all(activityRows.map((row) => hydrateActivity(userId, row, allAccounts)));
}

const hydrateActivity = async (
  userId: string,
  row: {
    id: string;
    name: string;
    date: Date;
    category: string | null;
    subcategory: string | null;
  },
  allAccounts: SimpleAccount[],
): Promise<EvidenceActivity> => {
  const [transactionRows, linkRows] = await Promise.all([
    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        fromAccountId: transactions.fromAccount,
        fromAccountName: accounts.name,
        toAccountId: transactions.toAccount,
      })
      .from(transactions)
      .leftJoin(accounts, eq(accounts.id, transactions.fromAccount))
      .where(eq(transactions.activity, row.id)),
    db
      .select({
        id: movements.id,
        name: movements.name,
        amount: movementsActivities.amount,
        movementAccount: movements.account,
      })
      .from(movementsActivities)
      .innerJoin(movements, eq(movements.id, movementsActivities.movement))
      .where(and(eq(movementsActivities.activity, row.id), eq(movements.user, userId))),
  ]);

  const toAccountNames = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(eq(accounts.user, userId));
  const toAccountName = (id: string) => toAccountNames.find((a) => a.id === id)?.name ?? id;

  // Compute reconciliation: are the linked movements already matching the
  // transactions for every movements-enabled account?
  const movementById = new Map(linkRows.map((r) => [r.id, { account: r.movementAccount }]));
  const activityMovements = linkRows.map((r) => ({ id: r.id, movement: r.id, amount: r.amount }));
  const activityTransactions = transactionRows.map((t) => ({
    id: t.id,
    amount: t.amount,
    fromAccount: t.fromAccountId,
    toAccount: t.toAccountId,
  }));
  const reconciled = getActivityMovementsReconciliated(
    activityTransactions,
    activityMovements,
    allAccounts.map((a) => ({ id: a.id, type: a.type as never, movements: a.movements })),
    (id) => movementById.get(id) as Movement | undefined,
  );

  return {
    id: row.id,
    name: row.name,
    date: row.date.toISOString(),
    category: row.category,
    subcategory: row.subcategory,
    reconciled,
    transactions: transactionRows.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      fromAccount: transaction.fromAccountName ?? transaction.id,
      toAccount: toAccountName(transaction.toAccountId),
    })),
    linkedMovements: linkRows,
  };
};

export async function buildEvidence(userId: string, movement: Movement): Promise<Evidence> {
  const account = (
    await db.select().from(accounts).where(eq(accounts.id, movement.account)).limit(1)
  )[0];

  // Fetch accounts first — needed to compute the `reconciled` flag on
  // each activity in searchActivities.
  const accountRows = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      movements: accounts.movements,
    })
    .from(accounts)
    .where(eq(accounts.user, userId));
  const simpleAccounts: SimpleAccount[] = accountRows;

  const dateWindowStart = new Date(movement.date);
  dateWindowStart.setDate(dateWindowStart.getDate() - DATE_WINDOW_DAYS);
  const dateWindowEnd = new Date(movement.date);
  dateWindowEnd.setDate(dateWindowEnd.getDate() + DATE_WINDOW_DAYS);

  const [
    similarMovements,
    activitiesByDateWindow,
    activitiesByName,
    categoryRows,
    subcategoryRows,
    projectRows,
    fundRows,
    counterpartyRows,
  ] = await Promise.all([
    findSimilarMovements(userId, movement.name, movement.id),
    searchActivities(userId, { fromDate: dateWindowStart, toDate: dateWindowEnd }, simpleAccounts),
    movement.name
      ? searchActivities(
          userId,
          { name: movement.name, limit: ACTIVITY_NAME_MATCHES_LIMIT },
          simpleAccounts,
        )
      : Promise.resolve([]),
    db
      .select({
        id: activityCategories.id,
        name: activityCategories.name,
      })
      .from(activityCategories)
      .where(eq(activityCategories.user, userId)),
    db
      .select({
        id: activitySubcategories.id,
        name: activitySubcategories.name,
        category: activityCategories.name,
      })
      .from(activitySubcategories)
      .leftJoin(activityCategories, eq(activityCategories.id, activitySubcategories.category))
      .where(eq(activitySubcategories.user, userId)),
    db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.user, userId))
      .orderBy(asc(projects.name)),
    db
      .select({ id: funds.id, name: funds.name, parentFund: funds.parentFund })
      .from(funds)
      .where(eq(funds.user, userId)),
    db
      .select({ id: counterparties.id, name: counterparties.name })
      .from(counterparties)
      .where(eq(counterparties.user, userId))
      .orderBy(asc(counterparties.name)),
  ]);

  return {
    movement: {
      id: movement.id,
      name: movement.name,
      amount: movement.amount,
      date: movement.date.toISOString(),
      account: {
        id: movement.account,
        name: account?.name ?? movement.account,
        type: account?.type ?? "unknown",
      },
    },
    similarMovements,
    activitiesByDateWindow,
    activitiesByName,
    vocabulary: {
      accounts: accountRows.map(({ id, name, type }) => ({ id, name, type })),
      categories: categoryRows,
      subcategories: subcategoryRows,
      projects: projectRows,
      funds: fundRows,
      counterparties: counterpartyRows,
    },
  };
}
