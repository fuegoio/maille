import { beforeEach, describe, expect, it } from "vitest";

// The stores persist through localStorage, which does not exist in the node
// test environment. The polyfill must run before they are imported, hence
// the dynamic imports below.
const persisted = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => persisted.get(key) ?? null,
  setItem: (key: string, value: string) => void persisted.set(key, value),
  removeItem: (key: string) => void persisted.delete(key),
} as unknown as Storage;

const { AccountType } = await import("@maille/core/accounts");
const { ActivityType } = await import("@maille/core/activities");
const { useAccounts } = await import("./accounts");
const { useActivities } = await import("./activities");

const bankAccount = {
  id: "bank",
  name: "Bank",
  type: AccountType.BANK_ACCOUNT,
  default: false,
  startingBalance: 0,
  startingCashBalance: null,
  movements: false,
  sharing: [],
};

const cashAccount = {
  ...bankAccount,
  id: "cash",
  name: "Cash",
  type: AccountType.CASH,
  movements: true,
};

const expenseAccount = {
  ...bankAccount,
  id: "expense",
  name: "Expenses",
  type: AccountType.EXPENSE,
};

function seedActivity(id: string, fromAccount: string) {
  return useActivities.getState().addActivity({
    id,
    name: id,
    description: null,
    date: new Date("2024-01-15T12:00:00Z"),
    type: ActivityType.EXPENSE,
    category: null,
    subcategory: null,
    project: null,
    sharing: [],
    transactions: [
      {
        id: `${id}-transaction`,
        amount: 100,
        fromAccount,
        toAccount: "expense",
      },
    ],
    movements: [],
  });
}

describe("updateAccount event and activity reconciliation status", () => {
  beforeEach(() => {
    useAccounts.setState({ accounts: [] });
    useActivities.setState({
      activities: [],
      activityCategories: [],
      activitySubcategories: [],
      showTransactions: false,
    });

    useAccounts.getState().addAccount(bankAccount);
    useAccounts.getState().addAccount(cashAccount);
    useAccounts.getState().addAccount(expenseAccount);
  });

  it("marks activities with transactions on the account incomplete when movements are enabled", () => {
    seedActivity("groceries", "bank");

    // The bank account has movements disabled: its transactions do not
    // require linked movements, so the activity is complete.
    expect(useActivities.getState().getActivityById("groceries")?.status).toBe(
      "completed",
    );

    useActivities.getState().handleEvent({
      type: "updateAccount",
      payload: { id: "bank", movements: true },
    } as never);

    expect(useActivities.getState().getActivityById("groceries")?.status).toBe(
      "incomplete",
    );
  });

  it("marks activities with transactions on the account complete when movements are disabled", () => {
    seedActivity("groceries", "cash");

    expect(useActivities.getState().getActivityById("groceries")?.status).toBe(
      "incomplete",
    );

    useActivities.getState().handleEvent({
      type: "updateAccount",
      payload: { id: "cash", movements: false },
    } as never);

    expect(useActivities.getState().getActivityById("groceries")?.status).toBe(
      "completed",
    );
  });

  it("leaves activities without a transaction on the account untouched", () => {
    seedActivity("groceries", "cash");
    const before = useActivities.getState().getActivityById("groceries");

    useActivities.getState().handleEvent({
      type: "updateAccount",
      payload: { id: "bank", movements: true },
    } as never);

    expect(useActivities.getState().getActivityById("groceries")).toBe(before);
  });

  it("recomputes statuses when an updateAccount mutation rolls back", () => {
    seedActivity("groceries", "bank");

    useActivities.getState().handleEvent({
      type: "updateAccount",
      payload: { id: "bank", movements: true },
    } as never);
    expect(useActivities.getState().getActivityById("groceries")?.status).toBe(
      "incomplete",
    );

    useActivities.getState().handleMutationError({
      name: "updateAccount",
      rollbackData: {
        id: "bank",
        startingBalance: 0,
        startingCashBalance: null,
        movements: false,
      },
    } as never);

    expect(useActivities.getState().getActivityById("groceries")?.status).toBe(
      "completed",
    );
  });
});
