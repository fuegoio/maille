import { describe, expect, it } from "vitest";
import { taskMessage, transcriptToLlmMessages } from "../../src/reconcile-movement/prompt";
import type { Evidence } from "../../src/reconcile-movement/evidence";
import type { WorkflowMessage } from "@maille/core/workflows";

const evidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  movement: {
    id: "movement-1",
    name: "Spotify",
    amount: -12.99,
    date: "2026-09-01T00:00:00.000Z",
    account: { id: "bank-1", name: "Bank", type: "bank" },
  },
  similarMovements: [],
  activitiesByDateWindow: [],
  activitiesByName: [],
  vocabulary: {
    accounts: [],
    categories: [],
    subcategories: [],
    projects: [],
    funds: [],
    counterparties: [],
  },
  ...overrides,
});

describe("taskMessage", () => {
  it("serializes the movement, remaining allocation, history and vocabulary", () => {
    const message = taskMessage(evidence(), -12.99);
    const parsed = JSON.parse(message.content ?? "{}");

    expect(message.role).toBe("user");
    expect(parsed.movement.name).toBe("Spotify");
    expect(parsed.remainingToAllocate).toBe(-12.99);
    expect(parsed.history).toEqual({
      similarMovements: [],
      activitiesByDateWindow: [],
      activitiesByName: [],
    });
    expect(parsed.vocabulary).toEqual({
      accounts: [],
      categories: [],
      subcategories: [],
      projects: [],
      funds: [],
      counterparties: [],
    });
  });

  it("carries the evidence lists into the history section", () => {
    const pack = evidence({
      similarMovements: [
        {
          id: "movement-2",
          name: "Spotify",
          amount: -12.99,
          date: "2026-08-01T00:00:00.000Z",
          links: [{ activityId: "a1", activityName: "Spotify", amount: -12.99 }],
        },
      ],
    });
    const parsed = JSON.parse(taskMessage(pack, 0).content ?? "{}");
    expect(parsed.history.similarMovements).toHaveLength(1);
    expect(parsed.history.similarMovements[0].links[0].activityId).toBe("a1");
  });
});

describe("transcriptToLlmMessages", () => {
  const message = (partial: Partial<WorkflowMessage>): WorkflowMessage => ({
    id: crypto.randomUUID(),
    role: "user",
    content: "",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...partial,
  });

  it("keeps user messages as-is", () => {
    const result = transcriptToLlmMessages([message({ role: "user", content: "Rent expense" })]);
    expect(result).toEqual([{ role: "user", content: "Rent expense" }]);
  });

  it("inlines answer options into assistant content", () => {
    const result = transcriptToLlmMessages([
      message({
        role: "assistant",
        content: "Which expense is this?",
        options: [
          { id: "option-0", label: "Rent" },
          { id: "option-1", label: "Groceries" },
        ],
      }),
    ]);
    expect(result).toEqual([
      { role: "assistant", content: "Which expense is this? Options: Rent; Groceries" },
    ]);
  });

  it("leaves assistant content untouched when there are no options", () => {
    const result = transcriptToLlmMessages([
      message({ role: "assistant", content: "Noted.", options: [] }),
    ]);
    expect(result).toEqual([{ role: "assistant", content: "Noted." }]);
  });
});
