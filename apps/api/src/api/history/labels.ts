import type { TransactionLeg } from "@maille/core/history";

import { db } from "@/database";
import {
  accounts,
  activityCategories,
  activitySubcategories,
  assets,
  counterparties,
  projects,
} from "@/tables";

import { eq } from "drizzle-orm";

/**
 * Display labels for entity ids referenced by history changes. Loaded once
 * per mutation and denormalized into the derived entries so history stays
 * readable even after the referenced entities are renamed or deleted.
 */
export interface HistoryLabels {
  account: (id: string) => string;
  asset: (id: string) => string;
  counterparty: (id: string) => string;
  category: (id: string) => string;
  subcategory: (id: string) => string;
  project: (id: string) => string;
}

export async function loadHistoryLabels(userId: string): Promise<HistoryLabels> {
  const [
    accountsData,
    assetsData,
    counterpartiesData,
    categoriesData,
    subcategoriesData,
    projectsData,
  ] = await Promise.all([
    db
      .select({ id: accounts.id, name: accounts.name })
      .from(accounts)
      .where(eq(accounts.user, userId)),
    db.select({ id: assets.id, name: assets.name }).from(assets).where(eq(assets.user, userId)),
    db
      .select({ id: counterparties.id, name: counterparties.name })
      .from(counterparties)
      .where(eq(counterparties.user, userId)),
    db
      .select({ id: activityCategories.id, name: activityCategories.name })
      .from(activityCategories)
      .where(eq(activityCategories.user, userId)),
    db
      .select({ id: activitySubcategories.id, name: activitySubcategories.name })
      .from(activitySubcategories)
      .where(eq(activitySubcategories.user, userId)),
    db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.user, userId)),
  ]);

  const toMap = (rows: { id: string; name: string }[]) =>
    new Map(rows.map((row) => [row.id, row.name]));

  const accountsMap = toMap(accountsData);
  const assetsMap = toMap(assetsData);
  const counterpartiesMap = toMap(counterpartiesData);
  const categoriesMap = toMap(categoriesData);
  const subcategoriesMap = toMap(subcategoriesData);
  const projectsMap = toMap(projectsData);

  return {
    account: (id) => accountsMap.get(id) ?? id,
    asset: (id) => assetsMap.get(id) ?? id,
    counterparty: (id) => counterpartiesMap.get(id) ?? id,
    category: (id) => categoriesMap.get(id) ?? id,
    subcategory: (id) => subcategoriesMap.get(id) ?? id,
    project: (id) => projectsMap.get(id) ?? id,
  };
}

/**
 * The display leg of a transaction: the most specific entity behind it
 * (asset / counterparty, else the account) with its label.
 */
export function transactionLeg(
  accountId: string,
  assetId: string | null | undefined,
  counterpartyId: string | null | undefined,
  labels: HistoryLabels,
): TransactionLeg {
  if (assetId) {
    return { ref: { type: "asset", id: assetId }, label: labels.asset(assetId) };
  }
  if (counterpartyId) {
    return {
      ref: { type: "counterparty", id: counterpartyId },
      label: labels.counterparty(counterpartyId),
    };
  }
  return {
    ref: { type: "account", id: accountId },
    label: labels.account(accountId),
  };
}
