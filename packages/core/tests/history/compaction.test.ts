import { describe, expect, it } from "vitest";

import {
  HISTORY_COMPACTION_WINDOW_MS,
  appendWithCompaction,
} from "@maille/core/history";
import type { SerializedHistoryEntry } from "@maille/core/history";

const entry = (
  partial: Partial<SerializedHistoryEntry> & Pick<SerializedHistoryEntry, "id">,
): SerializedHistoryEntry => ({
  entityType: "activity",
  entityId: "a1",
  action: "update",
  changes: [],
  createdAt: "2026-09-08T10:00:00.000Z",
  user: "user1",
  clientId: "client1",
  ...partial,
});

describe("appendWithCompaction", () => {
  it("appends when history is empty", () => {
    const newEntry = entry({
      id: "h2",
      changes: [{ field: "name", from: "A", to: "B" }],
    });

    const result = appendWithCompaction([], newEntry);
    expect(result.history).toEqual([newEntry]);
    expect(result.emitted?.id).toBe("h2");
  });

  it("compacts consecutive updates of the same field", () => {
    const history = [
      entry({
        id: "h1",
        createdAt: "2026-09-08T10:00:00.000Z",
        changes: [{ field: "name", from: "Lunch", to: "Lunch with J." }],
      }),
    ];
    const newEntry = entry({
      id: "h2",
      createdAt: "2026-09-08T10:04:00.000Z",
      changes: [{ field: "name", from: "Lunch with J.", to: "Team lunch" }],
    });

    const result = appendWithCompaction(history, newEntry);
    expect(result.history).toHaveLength(1);
    const merged = result.history[0]!;
    expect(merged.id).toBe("h1");
    expect(merged.changes).toEqual([
      { field: "name", from: "Lunch", to: "Team lunch" },
    ]);
    expect(merged.createdAt).toBe("2026-09-08T10:04:00.000Z");
    expect(result.emitted?.id).toBe("h1");
  });

  it("merges consecutive updates touching different fields into one entry", () => {
    const history = [
      entry({
        id: "h1",
        changes: [{ field: "name", from: "A", to: "B" }],
      }),
    ];
    const newEntry = entry({
      id: "h2",
      createdAt: "2026-09-08T10:05:00.000Z",
      changes: [{ field: "description", from: null, to: "note" }],
    });

    const result = appendWithCompaction(history, newEntry);
    expect(result.history).toHaveLength(1);
    expect(result.history[0]!.changes).toEqual([
      { field: "name", from: "A", to: "B" },
      { field: "description", from: null, to: "note" },
    ]);
  });

  it("does not compact when the window is exceeded", () => {
    const history = [
      entry({
        id: "h1",
        createdAt: "2026-09-08T10:00:00.000Z",
        changes: [{ field: "name", from: "A", to: "B" }],
      }),
    ];
    const newEntry = entry({
      id: "h2",
      createdAt: new Date(
        new Date("2026-09-08T10:00:00.000Z").getTime() +
          HISTORY_COMPACTION_WINDOW_MS +
          1000,
      ).toISOString(),
      changes: [{ field: "name", from: "B", to: "C" }],
    });

    const result = appendWithCompaction(history, newEntry);
    expect(result.history).toHaveLength(2);
    expect(result.emitted?.id).toBe("h2");
  });

  it("does not compact overlapping fields that do not chain", () => {
    const history = [
      entry({
        id: "h1",
        changes: [{ field: "name", from: "A", to: "B" }],
      }),
    ];
    // Something else changed the name in between — B -> X is not chained on B.
    const newEntry = entry({
      id: "h2",
      changes: [{ field: "name", from: "X", to: "C" }],
    });

    const result = appendWithCompaction(history, newEntry);
    expect(result.history).toHaveLength(2);
  });

  it("does not compact different actions or different users", () => {
    const link = entry({
      id: "h0",
      action: "link",
      changes: [{ field: "amount", from: null, to: 10 }],
    });
    const update = entry({
      id: "h1",
      changes: [{ field: "name", from: "A", to: "B" }],
    });

    expect(appendWithCompaction([link], update).history).toHaveLength(2);

    const otherUser = entry({
      id: "h2",
      user: "user2",
      changes: [{ field: "name", from: "B", to: "C" }],
    });
    expect(appendWithCompaction([update], otherUser).history).toHaveLength(2);
  });

  it("removes the tail when the update reverts it entirely", () => {
    const history = [
      entry({
        id: "h1",
        changes: [{ field: "name", from: "A", to: "B" }],
      }),
    ];
    const revert = entry({
      id: "h2",
      changes: [{ field: "name", from: "B", to: "A" }],
    });

    const result = appendWithCompaction(history, revert);
    expect(result.history).toHaveLength(0);
    expect(result.emitted).toBeNull();
  });

  it("keeps non-reverted fields when an update partially reverts", () => {
    const history = [
      entry({
        id: "h1",
        changes: [
          { field: "name", from: "A", to: "B" },
          { field: "description", from: null, to: "note" },
        ],
      }),
    ];
    const revert = entry({
      id: "h2",
      changes: [{ field: "name", from: "B", to: "A" }],
    });

    const result = appendWithCompaction(history, revert);
    expect(result.history).toHaveLength(1);
    expect(result.history[0]!.changes).toEqual([
      { field: "description", from: null, to: "note" },
    ]);
    expect(result.emitted?.id).toBe("h1");
  });
});
