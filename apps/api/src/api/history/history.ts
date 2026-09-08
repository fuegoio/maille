import { appendWithCompaction } from "@maille/core/history";
import type { NewHistoryEntry, SerializedHistoryEntry } from "@maille/core/history";

import { addEvent } from "@/api/events";
import type { SessionData } from "@/api/auth";

/**
 * Stamps the derived entries with identity, compacts each one into the
 * entity's current history and returns the array to persist. Callers write
 * the returned array on the entity row and emit the emitted entries as
 * `createHistory` sync events (upsert by id on the receiving end).
 */
export function computeHistory(
  ctx: SessionData,
  current: SerializedHistoryEntry[],
  entries: NewHistoryEntry[],
): { history: SerializedHistoryEntry[]; emitted: SerializedHistoryEntry[] } {
  let history = current;
  const emitted: SerializedHistoryEntry[] = [];

  for (const newEntry of entries) {
    const entry: SerializedHistoryEntry = {
      ...newEntry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      user: ctx.user.id,
      clientId: ctx.session.id,
    };

    const result = appendWithCompaction(history, entry);
    history = result.history;
    if (result.emitted) {
      emitted.push(result.emitted);
    }
  }

  return { history, emitted };
}

/**
 * Emits the `createHistory` sync events for entries derived by
 * `computeHistory`, after the entity write succeeded.
 */
export async function emitHistoryEvents(
  ctx: SessionData,
  emitted: SerializedHistoryEntry[],
): Promise<void> {
  for (const entry of emitted) {
    await addEvent({
      type: "createHistory",
      payload: entry,
      createdAt: new Date(),
      clientId: ctx.session.id,
      user: ctx.user.id,
    });
  }
}
