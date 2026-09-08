import { appendWithCompaction } from "@maille/core/history";
import type { NewHistoryEntry, SerializedHistoryEntry } from "@maille/core/history";

import { addEvent } from "@/api/events";

/**
 * The identity that stamps history entries and events: which user the entry
 * belongs to, and which client (session, workflows worker...) performed the
 * write. GraphQL resolvers pass their context, which satisfies this shape.
 */
export type HistoryWriter = {
  user: { id: string };
  session: { id: string };
};

/**
 * Stamps the derived entries with identity, compacts each one into the
 * entity's current history and returns the array to persist. Callers write
 * the returned array on the entity row and emit the emitted entries as
 * `createHistory` sync events (upsert by id on the receiving end).
 */
export function computeHistory(
  writer: HistoryWriter,
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
      user: writer.user.id,
      clientId: writer.session.id,
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
  writer: HistoryWriter,
  emitted: SerializedHistoryEntry[],
): Promise<void> {
  for (const entry of emitted) {
    await addEvent({
      type: "createHistory",
      payload: entry,
      createdAt: new Date(),
      clientId: writer.session.id,
      user: writer.user.id,
    });
  }
}
