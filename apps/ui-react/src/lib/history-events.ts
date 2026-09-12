import type { Activity, Transaction } from "@maille/core/activities";
import type {
  HistoryEntity,
  NewHistoryEntry,
  SerializedHistoryEntry,
  TransactionHistorySnapshot,
  TransactionLeg,
} from "@maille/core/history";
import type { Movement } from "@maille/core/movements";
import type { CreateHistoryEvent } from "@maille/core/sync";

import {
  appendWithCompaction,
  buildAddTransactionEntry,
  buildCreateEntry,
  buildLinkEntry,
  buildRemoveTransactionEntry,
  buildUnlinkEntry,
  buildUpdateLinkEntry,
  buildUpdateTransactionEntry,
  diffActivity,
  diffMovement,
  diffTransaction,
} from "@maille/core/history";

import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAssets } from "@/stores/assets";
import { useAuth } from "@/stores/auth";
import { useCounterparties } from "@/stores/counterparties";
import { useMovements } from "@/stores/movements";
import { useProjects } from "@/stores/projects";

/**
 * The expected `createHistory` event of a mutation, as declared in
 * `mutation.events` (identity fields are stamped by the sync store).
 */
export type ExpectedHistoryEvent = Omit<
  CreateHistoryEvent,
  "clientId" | "createdAt" | "user"
>;

/**
 * Builds the optimistic `createHistory` event a mutation should emit:
 * stamps the derived entry, compacts it into the entity's current history
 * (same logic as the backend) and returns the entry to upsert — or null
 * when the update fully reverted the previous one and nothing should be
 * emitted.
 */
function historyEvent(
  currentHistory: SerializedHistoryEntry[],
  entry: NewHistoryEntry,
): ExpectedHistoryEvent | null {
  const auth = useAuth.getState();
  const stamped: SerializedHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    user: auth.user!.id,
    clientId: auth.session!.id,
  };
  const { emitted } = appendWithCompaction(currentHistory, stamped);
  return emitted ? { type: "createHistory", payload: emitted } : null;
}

function omitUndefined<T extends Record<string, unknown>>(update: T): T {
  return Object.fromEntries(
    Object.entries(update).filter(([_, value]) => value !== undefined),
  ) as T;
}

//
// Label lookups (client mirror of the API's loadHistoryLabels)
//

function historyEntity(
  id: string | null,
  label: (id: string) => string | undefined,
): HistoryEntity | null {
  return id ? { id, label: label(id) ?? id } : null;
}

function toActivitySnapshot(activity: {
  name: string;
  description: string | null;
  date: Date;
  category: string | null;
  subcategory: string | null;
  project: string | null;
}) {
  const categories = useActivities.getState().activityCategories;
  const subcategories = useActivities.getState().activitySubcategories;
  const projects = useProjects.getState().projects;
  return {
    name: activity.name,
    description: activity.description,
    date: activity.date.toISOString(),
    category: historyEntity(
      activity.category,
      (id) => categories.find((c) => c.id === id)?.name,
    ),
    subcategory: historyEntity(
      activity.subcategory,
      (id) => subcategories.find((s) => s.id === id)?.name,
    ),
    project: historyEntity(
      activity.project,
      (id) => projects.find((p) => p.id === id)?.name,
    ),
  };
}

function toMovementSnapshot(movement: {
  name: string;
  date: Date;
  amount: number;
  account: string;
}) {
  const account = useAccounts.getState().getAccountById(movement.account);
  return {
    name: movement.name,
    date: movement.date.toISOString(),
    amount: movement.amount,
    account: {
      id: movement.account,
      label: account?.name ?? movement.account,
    },
  };
}

function clientTransactionLeg(
  accountId: string,
  assetId: string | null | undefined,
  counterpartyId: string | null | undefined,
): TransactionLeg | null {
  if (assetId) {
    const asset = useAssets.getState().getAssetById(assetId);
    return {
      ref: { type: "asset", id: assetId },
      label: asset?.name ?? assetId,
    };
  }
  if (counterpartyId) {
    const counterparty = useCounterparties
      .getState()
      .getCounterpartyById(counterpartyId);
    return {
      ref: { type: "counterparty", id: counterpartyId },
      label: counterparty?.name ?? counterpartyId,
    };
  }
  const account = useAccounts.getState().getAccountById(accountId);
  return {
    ref: { type: "account", id: accountId },
    label: account?.name ?? accountId,
  };
}

function toTransactionSnapshot(
  transaction: Pick<
    Transaction,
    | "amount"
    | "fromAccount"
    | "fromAsset"
    | "fromCounterparty"
    | "toAccount"
    | "toAsset"
    | "toCounterparty"
  >,
): TransactionHistorySnapshot {
  return {
    amount: transaction.amount,
    from: clientTransactionLeg(
      transaction.fromAccount,
      transaction.fromAsset ?? null,
      transaction.fromCounterparty ?? null,
    ),
    to: clientTransactionLeg(
      transaction.toAccount,
      transaction.toAsset ?? null,
      transaction.toCounterparty ?? null,
    ),
  };
}

//
// Builders — one per mutation, mirroring the server-side derivation
//

export function activityCreateHistoryEvent(
  activityId: string,
): ExpectedHistoryEvent {
  return historyEvent([], buildCreateEntry("activity", activityId))!;
}

export function movementCreateHistoryEvent(
  movementId: string,
): ExpectedHistoryEvent {
  return historyEvent([], buildCreateEntry("movement", movementId))!;
}

export function activityUpdateHistoryEvent(
  activity: Activity,
  update: {
    name?: string;
    description?: string | null;
    date?: Date;
    category?: string | null;
    subcategory?: string | null;
    project?: string | null;
  },
): ExpectedHistoryEvent | null {
  const changes = diffActivity(
    toActivitySnapshot(activity),
    toActivitySnapshot({
      ...activity,
      ...omitUndefined(
        update as unknown as Record<string, string | number | Date | null>,
      ),
    }),
  );
  if (changes.length === 0) return null;
  const current =
    useActivities.getState().getActivityById(activity.id)?.history ??
    activity.history;
  return historyEvent(current, {
    entityType: "activity",
    entityId: activity.id,
    action: "update",
    changes,
  });
}

export function movementUpdateHistoryEvent(
  movement: Movement,
  update: {
    date?: Date;
    amount?: number;
    account?: string;
    name?: string;
  },
): ExpectedHistoryEvent | null {
  const changes = diffMovement(
    toMovementSnapshot(movement),
    toMovementSnapshot({
      ...movement,
      ...omitUndefined(
        update as unknown as Record<string, string | number | Date | null>,
      ),
    }),
  );
  if (changes.length === 0) return null;
  const current =
    useMovements.getState().getMovementById(movement.id)?.history ??
    movement.history;
  return historyEvent(current, {
    entityType: "movement",
    entityId: movement.id,
    action: "update",
    changes,
  });
}

export function linkMovementHistoryEvent(
  movement: Movement,
  activity: { id: string; name: string },
  amount: number,
): ExpectedHistoryEvent {
  const current =
    useMovements.getState().getMovementById(movement.id)?.history ??
    movement.history;
  return historyEvent(
    current,
    buildLinkEntry(
      "movement",
      movement.id,
      {
        type: "activity",
        id: activity.id,
        label: activity.name,
      },
      amount,
    ),
  )!;
}

export function linkActivityHistoryEvent(
  activity: Activity,
  movement: { id: string; name: string },
  amount: number,
): ExpectedHistoryEvent {
  const current =
    useActivities.getState().getActivityById(activity.id)?.history ??
    activity.history;
  return historyEvent(
    current,
    buildLinkEntry(
      "activity",
      activity.id,
      {
        type: "movement",
        id: movement.id,
        label: movement.name,
      },
      amount,
    ),
  )!;
}

export function unlinkMovementHistoryEvent(
  movement: Movement,
  activity: { id: string; name: string },
  amount: number,
): ExpectedHistoryEvent {
  const current =
    useMovements.getState().getMovementById(movement.id)?.history ??
    movement.history;
  return historyEvent(
    current,
    buildUnlinkEntry(
      "movement",
      movement.id,
      {
        type: "activity",
        id: activity.id,
        label: activity.name,
      },
      amount,
    ),
  )!;
}

export function unlinkActivityHistoryEvent(
  activity: Activity,
  movement: { id: string; name: string },
  amount: number,
): ExpectedHistoryEvent {
  const current =
    useActivities.getState().getActivityById(activity.id)?.history ??
    activity.history;
  return historyEvent(
    current,
    buildUnlinkEntry(
      "activity",
      activity.id,
      {
        type: "movement",
        id: movement.id,
        label: movement.name,
      },
      amount,
    ),
  )!;
}

export function updateLinkMovementHistoryEvent(
  movement: Movement,
  activity: { id: string; name: string },
  fromAmount: number,
  toAmount: number,
): ExpectedHistoryEvent | null {
  const entry = buildUpdateLinkEntry(
    "movement",
    movement.id,
    {
      type: "activity",
      id: activity.id,
      label: activity.name,
    },
    fromAmount,
    toAmount,
  );
  if (!entry) return null;
  const current =
    useMovements.getState().getMovementById(movement.id)?.history ??
    movement.history;
  return historyEvent(current, entry);
}

export function updateLinkActivityHistoryEvent(
  activity: Activity,
  movement: { id: string; name: string },
  fromAmount: number,
  toAmount: number,
): ExpectedHistoryEvent | null {
  const entry = buildUpdateLinkEntry(
    "activity",
    activity.id,
    {
      type: "movement",
      id: movement.id,
      label: movement.name,
    },
    fromAmount,
    toAmount,
  );
  if (!entry) return null;
  const current =
    useActivities.getState().getActivityById(activity.id)?.history ??
    activity.history;
  return historyEvent(current, entry);
}

export function addTransactionHistoryEvent(
  activity: Activity,
  transaction: Parameters<typeof toTransactionSnapshot>[0],
): ExpectedHistoryEvent {
  const current =
    useActivities.getState().getActivityById(activity.id)?.history ??
    activity.history;
  return historyEvent(
    current,
    buildAddTransactionEntry(
      "activity",
      activity.id,
      toTransactionSnapshot(transaction),
    ),
  )!;
}

export function updateTransactionHistoryEvent(
  activity: Activity,
  before: Parameters<typeof toTransactionSnapshot>[0],
  after: Parameters<typeof toTransactionSnapshot>[0],
): ExpectedHistoryEvent | null {
  const entry = buildUpdateTransactionEntry(
    "activity",
    activity.id,
    diffTransaction(
      toTransactionSnapshot(before),
      toTransactionSnapshot(after),
    ),
  );
  if (!entry) return null;
  const current =
    useActivities.getState().getActivityById(activity.id)?.history ??
    activity.history;
  return historyEvent(current, entry);
}

export function removeTransactionHistoryEvent(
  activity: Activity,
  transaction: Parameters<typeof toTransactionSnapshot>[0],
): ExpectedHistoryEvent {
  const current =
    useActivities.getState().getActivityById(activity.id)?.history ??
    activity.history;
  return historyEvent(
    current,
    buildRemoveTransactionEntry(
      "activity",
      activity.id,
      toTransactionSnapshot(transaction),
    ),
  )!;
}
