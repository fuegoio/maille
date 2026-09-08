import type { HistoryChange, SerializedHistoryEntry } from "./types";

/**
 * Consecutive `update` entries by the same user within this window are
 * compacted into a single entry. Both the backend and the front-end must use
 * the same value so predicted events match derived ones.
 */
export const HISTORY_COMPACTION_WINDOW_MS = 15 * 60 * 1000;

export interface AppendHistoryResult {
  history: SerializedHistoryEntry[];
  /**
   * The entry to emit as a `createHistory` sync event (upsert semantics: same
   * id as the existing tail when the entry was compacted into it). Null when
   * the entry cancelled out with the tail (full revert) and the tail was
   * removed — nothing should be emitted.
   */
  emitted: SerializedHistoryEntry | null;
}

/**
 * Appends an entry to an entity's history, compacting it into the tail entry
 * when both are consecutive property edits. Pure: used identically by the
 * backend (deriving from DB state) and the front-end (predicting for
 * optimistic display).
 */
export function appendWithCompaction(
  history: SerializedHistoryEntry[],
  entry: SerializedHistoryEntry,
  windowMs: number = HISTORY_COMPACTION_WINDOW_MS,
): AppendHistoryResult {
  const last = history.at(-1);

  if (last && canCompact(last, entry, windowMs)) {
    const changes = mergeChanges(last.changes, entry.changes);
    if (changes.length === 0) {
      // The update reverted the previous one — act as if it never happened.
      return {
        history: history.slice(0, -1),
        emitted: null,
      };
    }
    const merged: SerializedHistoryEntry = {
      ...last,
      changes,
      createdAt: entry.createdAt,
      user: entry.user,
      clientId: entry.clientId,
    };
    return {
      history: [...history.slice(0, -1), merged],
      emitted: merged,
    };
  }

  return {
    history: [...history, entry],
    emitted: entry,
  };
}

function canCompact(
  last: SerializedHistoryEntry,
  entry: SerializedHistoryEntry,
  windowMs: number,
): boolean {
  if (last.action !== "update" || entry.action !== "update") return false;
  if (last.user !== entry.user) return false;
  if (
    new Date(entry.createdAt).getTime() - new Date(last.createdAt).getTime() >
    windowMs
  ) {
    return false;
  }
  // Overlapping fields must chain (last.to === entry.from) so that merging
  // hides nothing that happened in between.
  return entry.changes.every((change) => {
    const previous = last.changes.find((c) => c.field === change.field);
    return previous === undefined || previous.to === change.from;
  });
}

function mergeChanges(
  from: HistoryChange[],
  to: HistoryChange[],
): HistoryChange[] {
  const merged: HistoryChange[] = [];

  for (const change of from) {
    const next = to.find((c) => c.field === change.field);
    if (!next) {
      merged.push(change);
    } else if (change.from !== next.to) {
      // Drop the change when it was fully reverted by the new entry.
      merged.push({ ...change, to: next.to, toRef: next.toRef });
    }
  }

  for (const change of to) {
    // Fields already merged above — skip even when they were dropped, they
    // are consumed by the merge.
    if (from.some((c) => c.field === change.field)) continue;
    if (change.from !== change.to) merged.push(change);
  }

  return merged;
}
