import type { ActivityType } from "../activities/types";
import type {
  HistoryChange,
  HistoryRef,
  HistoryRefType,
  HistorySubject,
  NewHistoryEntry,
} from "./types";

/**
 * Derivation of history entries from display-ready snapshots. Both the
 * backend (from DB rows + label lookups) and the front-end (from store
 * state) build these snapshots and call the same functions, so predicted
 * events match derived ones.
 */

/** An entity referenced by a change, with its display label. */
export interface HistoryEntity {
  id: string;
  label: string;
}

/**
 * One leg of a transaction. The ref points at the most specific entity
 * behind the leg (asset / counterparty / account) — the same one the label
 * was resolved from.
 */
export interface TransactionLeg {
  ref: HistoryRef;
  label: string;
}

export interface ActivityHistorySnapshot {
  name: string;
  description: string | null;
  date: string;
  type: ActivityType;
  category: HistoryEntity | null;
  subcategory: HistoryEntity | null;
  project: HistoryEntity | null;
}

export interface MovementHistorySnapshot {
  name: string;
  date: string;
  amount: number;
  account: HistoryEntity | null;
}

export interface TransactionHistorySnapshot {
  amount: number;
  from: TransactionLeg | null;
  to: TransactionLeg | null;
}

function refChange(
  field: string,
  from: HistoryEntity | null,
  to: HistoryEntity | null,
  type: HistoryRefType,
): HistoryChange | null {
  if (from?.id === to?.id) return null;
  return {
    field,
    from: from?.label ?? null,
    to: to?.label ?? null,
    ...(from ? { fromRef: { type, id: from.id } } : {}),
    ...(to ? { toRef: { type, id: to.id } } : {}),
  };
}

function legChange(
  field: string,
  from: TransactionLeg | null,
  to: TransactionLeg | null,
): HistoryChange | null {
  if (from?.ref.type === to?.ref.type && from?.ref.id === to?.ref.id) {
    return null;
  }
  return {
    field,
    from: from?.label ?? null,
    to: to?.label ?? null,
    ...(from ? { fromRef: from.ref } : {}),
    ...(to ? { toRef: to.ref } : {}),
  };
}

function valueChange(
  field: string,
  from: string | number | null,
  to: string | number | null,
): HistoryChange | null {
  if (from === to) return null;
  return { field, from, to };
}

export function diffActivity(
  before: ActivityHistorySnapshot,
  after: ActivityHistorySnapshot,
): HistoryChange[] {
  return [
    valueChange("name", before.name, after.name),
    valueChange("description", before.description, after.description),
    valueChange("date", before.date, after.date),
    valueChange("type", before.type, after.type),
    refChange("category", before.category, after.category, "category"),
    refChange("subcategory", before.subcategory, after.subcategory, "subcategory"),
    refChange("project", before.project, after.project, "project"),
  ].filter((change): change is HistoryChange => change !== null);
}

export function diffMovement(
  before: MovementHistorySnapshot,
  after: MovementHistorySnapshot,
): HistoryChange[] {
  return [
    valueChange("name", before.name, after.name),
    valueChange("date", before.date, after.date),
    valueChange("amount", before.amount, after.amount),
    refChange("account", before.account, after.account, "account"),
  ].filter((change): change is HistoryChange => change !== null);
}

export function diffTransaction(
  before: TransactionHistorySnapshot,
  after: TransactionHistorySnapshot,
): HistoryChange[] {
  return [
    valueChange("amount", before.amount, after.amount),
    legChange("from", before.from, after.from),
    legChange("to", before.to, after.to),
  ].filter((change): change is HistoryChange => change !== null);
}

//
// Entry builders
//

export function buildCreateEntry(
  entityType: "activity" | "movement",
  entityId: string,
): NewHistoryEntry {
  return {
    entityType,
    entityId,
    action: "create",
    changes: [],
  };
}

export function buildLinkEntry(
  entityType: "activity" | "movement",
  entityId: string,
  subject: HistorySubject,
  amount: number,
): NewHistoryEntry {
  return {
    entityType,
    entityId,
    action: "link",
    subject,
    changes: [{ field: "amount", from: null, to: amount }],
  };
}

export function buildUnlinkEntry(
  entityType: "activity" | "movement",
  entityId: string,
  subject: HistorySubject,
  amount: number,
): NewHistoryEntry {
  return {
    entityType,
    entityId,
    action: "unlink",
    subject,
    changes: [{ field: "amount", from: amount, to: null }],
  };
}

export function buildUpdateLinkEntry(
  entityType: "activity" | "movement",
  entityId: string,
  subject: HistorySubject,
  fromAmount: number,
  toAmount: number,
): NewHistoryEntry | null {
  if (fromAmount === toAmount) return null;
  return {
    entityType,
    entityId,
    action: "updateLink",
    subject,
    changes: [{ field: "amount", from: fromAmount, to: toAmount }],
  };
}

export function buildAddTransactionEntry(
  entityType: "activity" | "movement",
  entityId: string,
  transaction: TransactionHistorySnapshot,
): NewHistoryEntry {
  return {
    entityType,
    entityId,
    action: "addTransaction",
    changes: [
      { field: "amount", from: null, to: transaction.amount },
      legChange("from", null, transaction.from),
      legChange("to", null, transaction.to),
    ].filter((change): change is HistoryChange => change !== null),
  };
}

export function buildUpdateTransactionEntry(
  entityType: "activity" | "movement",
  entityId: string,
  changes: HistoryChange[],
): NewHistoryEntry | null {
  if (changes.length === 0) return null;
  return {
    entityType,
    entityId,
    action: "updateTransaction",
    changes,
  };
}

export function buildRemoveTransactionEntry(
  entityType: "activity" | "movement",
  entityId: string,
  transaction: TransactionHistorySnapshot,
): NewHistoryEntry {
  return {
    entityType,
    entityId,
    action: "removeTransaction",
    changes: [
      { field: "amount", from: transaction.amount, to: null },
      legChange("from", transaction.from, null),
      legChange("to", transaction.to, null),
    ].filter((change): change is HistoryChange => change !== null),
  };
}
