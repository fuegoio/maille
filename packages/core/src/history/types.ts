export type HistoryEntityType = "activity" | "movement";

export type HistoryAction =
  | "create"
  | "update"
  | "link"
  | "unlink"
  | "updateLink"
  | "addTransaction"
  | "updateTransaction"
  | "removeTransaction";

export type HistoryRefType =
  | "activity"
  | "movement"
  | "category"
  | "subcategory"
  | "project"
  | "account"
  | "asset"
  | "counterparty"
  | "transaction";

export interface HistoryRef {
  type: HistoryRefType;
  id: string;
}

/** A referenced entity with its display label, denormalized at derivation time. */
export interface HistorySubject extends HistoryRef {
  label: string;
}

export type HistoryValue = string | number | null;

export interface HistoryChange {
  field: string;
  from: HistoryValue;
  to: HistoryValue;
  fromRef?: HistoryRef;
  toRef?: HistoryRef;
}

/**
 * A history entry as stored on the entity (jsonb column), exchanged in sync
 * events and served by the API. Dates are ISO strings at rest.
 */
export interface SerializedHistoryEntry {
  id: string;
  entityType: HistoryEntityType;
  entityId: string;
  action: HistoryAction;
  subject?: HistorySubject;
  changes: HistoryChange[];
  createdAt: string;
  user: string;
  clientId: string;
}

/** An entry before the emitter stamps its identity (id, createdAt, user, clientId). */
export type NewHistoryEntry = Omit<
  SerializedHistoryEntry,
  "id" | "createdAt" | "user" | "clientId"
>;
