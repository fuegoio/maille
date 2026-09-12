import type { Account } from "@maille/core/accounts";
import type { Activity, Transaction } from "@maille/core/activities";
import type { Fund, FundAllocation, FundMove } from "@maille/core/funds";

import { AccountType } from "@maille/core/accounts";
import { describe, expect, it } from "vitest";

import {
  activityTouchesFund,
  classifyFundMoves,
  flattenActivityFundMoves,
  getAccountSpreadAcrossFunds,
  getDefaultFundByAccount,
  getFundChildren,
  getFundSpreadAcrossAccounts,
  getFundTreeBalance,
  getFundTreeBalanceAtDate,
  getFundTreeFlowsBetweenDates,
  getFundTreeSpreadAcrossAccounts,
  getFundsBalances,
  getTransactionSideFund,
  getUntrackedBalanceAtDate,
  getUntrackedByAccountAtDate,
} from "./funds";

const fund = (id: string, parentFund: string | null = null): Fund => ({
  id,
  name: id,
  color: "#818cf8",
  startDate: null,
  endDate: null,
  parentFund,
});

const move = (partial: Partial<FundMove> & Pick<FundMove, "id">): FundMove => ({
  fromFund: null,
  toFund: null,
  amount: 0,
  date: new Date("2026-01-01"),
  note: null,
  transaction: null,
  ...partial,
});

const account = (
  id: string,
  startingBalance: number,
  type: AccountType = AccountType.BANK_ACCOUNT,
): Account => ({
  id,
  name: id,
  type,
  default: false,
  startingBalance,
  startingCashBalance: null,
  movements: true,
  sharing: [],
});

const allocation = (
  id: string,
  fundId: string,
  accountId: string,
  amount: number,
): FundAllocation => ({ id, fund: fundId, account: accountId, amount });

const transaction = (
  id: string,
  amount: number,
  fromAccount: string,
  toAccount: string,
  fundMoves: FundMove[] = [],
): Transaction => ({
  id,
  amount,
  fromAccount,
  toAccount,
  fundMoves,
});

const activity = (
  id: string,
  date: string,
  transactions: Transaction[],
): Activity => ({
  id,
  name: id,
  description: null,
  date: new Date(date),
  types: [],
  amounts: {
    expense: 0,
    revenue: 0,
    investment: 0,
    neutral: 0,
  },
  category: null,
  subcategory: null,
  project: null,
  transactions,
  movements: [],
  amount: 0,
  sharing: [],
  status: "completed",
  history: [],
});

describe("funds balances (ui logic)", () => {
  it("derives balances from opening allocations and transaction-linked draw-downs", () => {
    const funds = [fund("house")];
    const moves = [
      // Buy paint: 450 leaves the house fund via a transaction leg
      move({
        id: "2",
        fromFund: "house",
        toFund: null,
        amount: 450,
        transaction: "tx-1",
      }),
    ];
    const allocations = [allocation("a1", "house", "checking", 30000)];

    const balances = getFundsBalances(funds, moves, allocations);
    expect(balances.find((b) => b.fund.id === "house")?.balance).toBe(29550);
  });

  it("is unaffected by moves of deleted funds (cascade cleanup)", () => {
    const funds = [fund("liquid")];
    const moves = [
      move({ id: "1", fromFund: null, toFund: "liquid", amount: 100 }),
    ];

    const balances = getFundsBalances(funds, moves);
    expect(balances.find((b) => b.fund.id === "liquid")?.balance).toBe(100);
  });
});

describe("fund tree rollups (ui logic)", () => {
  const savings = fund("savings");
  const house = fund("house", "savings");
  const kitchen = fund("kitchen", "savings");
  const liquid = fund("liquid");

  it("a parent's rollup aggregates its whole subtree, allocations included", () => {
    const funds = [savings, house, kitchen, liquid];
    const moves = [
      move({ id: "1", fromFund: null, toFund: "savings", amount: 1000 }),
      move({ id: "2", fromFund: "savings", toFund: "house", amount: 300 }),
      move({ id: "3", fromFund: null, toFund: "kitchen", amount: 120 }),
    ];
    const allocations = [
      allocation("a1", "house", "checking", 200),
      allocation("a2", "liquid", "checking", 50),
    ];
    expect(getFundTreeBalance("savings", funds, moves, allocations)).toBe(1320);
    expect(getFundTreeBalance("house", funds, moves, allocations)).toBe(500);
    expect(getFundTreeBalance("kitchen", funds, moves, allocations)).toBe(120);
    expect(getFundTreeBalance("liquid", funds, moves, allocations)).toBe(50);
  });

  it("a subtree's balance at a date counts only what landed by then", () => {
    const funds = [{ ...house, startDate: new Date("2026-01-10") }];
    const moves = [
      move({
        id: "1",
        fromFund: "house",
        toFund: null,
        amount: 100,
        date: new Date("2026-01-15"),
        transaction: "tx-1",
      }),
    ];
    const allocations = [allocation("a1", "house", "checking", 400)];
    const startingDate = new Date("2025-01-01");

    // Before the fund starts: nothing has landed.
    expect(
      getFundTreeBalanceAtDate(
        "house",
        funds,
        moves,
        allocations,
        startingDate,
        new Date("2026-01-09"),
      ),
    ).toBe(0);
    // After the allocation lands, before the draw-down.
    expect(
      getFundTreeBalanceAtDate(
        "house",
        funds,
        moves,
        allocations,
        startingDate,
        new Date("2026-01-12"),
      ),
    ).toBe(400);
    // After everything.
    expect(
      getFundTreeBalanceAtDate(
        "house",
        funds,
        moves,
        allocations,
        startingDate,
        new Date("2026-01-31"),
      ),
    ).toBe(300);
  });

  it("flows count only money crossing the subtree boundary, allocations in", () => {
    // The house fund starts inside the window, so its opening allocation
    // crosses the savings tree's boundary as an inflow.
    const houseDated = { ...house, startDate: new Date("2026-01-05") };
    const funds = [savings, houseDated, kitchen];
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    const startingDate = new Date("2025-01-01");
    const moves = [
      // Enters the savings tree from Untracked.
      move({
        id: "1",
        fromFund: null,
        toFund: "savings",
        amount: 1000,
        date: from,
      }),
      // Internal redistribution: neither in nor out for savings.
      move({
        id: "2",
        fromFund: "savings",
        toFund: "house",
        amount: 300,
        date: from,
      }),
      // Leaves the tree to Untracked: out.
      move({
        id: "3",
        fromFund: "kitchen",
        toFund: null,
        amount: 120,
        date: from,
      }),
      // Same window, outside it: ignored.
      move({
        id: "4",
        fromFund: null,
        toFund: "house",
        amount: 50,
        date: new Date("2026-03-01"),
      }),
    ];
    const allocations = [
      // Lands inside the window: an inflow from Untracked.
      allocation("a1", "house", "checking", 200),
    ];

    const flows = getFundTreeFlowsBetweenDates(
      "savings",
      funds,
      moves,
      allocations,
      startingDate,
      from,
      to,
    );
    expect(flows.in).toBe(1200);
    expect(flows.out).toBe(120);

    // A leaf sees its own moves, matching the flat-fund behavior.
    const leafFlows = getFundTreeFlowsBetweenDates(
      "house",
      funds,
      moves,
      allocations,
      startingDate,
      from,
      to,
    );
    expect(leafFlows.in).toBe(500);
  });

  it("children are name-sorted and direct only", () => {
    const funds = [savings, kitchen, house, liquid];
    expect(getFundChildren("savings", funds).map((f) => f.id)).toEqual([
      "house",
      "kitchen",
    ]);
    expect(getFundChildren("liquid", funds)).toEqual([]);
  });
});

describe("positions (ui logic)", () => {
  // One checking account seeded with 1000, a house fund starting on Jan 1
  // with 400 earmarked on it, then 300 moving to savings while keeping the
  // house pin (the rest stays untracked).
  const accounts = [account("checking", 1000), account("savings", 0)];
  const funds = [{ ...fund("house"), startDate: new Date("2026-01-01") }];
  const leg = move({
    id: "l1",
    fromFund: "house",
    toFund: null,
    amount: 300,
    transaction: "t1",
  });
  const fundAllocations = [allocation("a1", "house", "checking", 400)];
  const activities = [
    activity("act-1", "2026-01-05", [
      transaction("t1", 300, "checking", "savings", [leg]),
    ]),
  ];
  const startingDate = new Date("2025-01-01");

  const input = {
    accounts,
    activities,
    funds,
    fundAllocations,
    startingDate,
  };

  it("untracked shrinks as allocations land and legs draw funds", () => {
    expect(
      getUntrackedBalanceAtDate({
        ...input,
        date: new Date("2025-12-31"),
      }),
    ).toBe(1000);
    expect(
      getUntrackedBalanceAtDate({
        ...input,
        date: new Date("2026-01-03"),
      }),
    ).toBe(600);
    expect(
      getUntrackedBalanceAtDate({
        ...input,
        date: new Date("2026-01-31"),
      }),
    ).toBe(900);
  });

  it("untracked is broken down per account", () => {
    const untracked = getUntrackedByAccountAtDate({
      ...input,
      date: new Date("2026-01-31"),
    });
    expect(untracked.get("checking")).toBe(600);
    expect(untracked.get("savings")).toBe(300);
  });

  it("a fund spreads across the accounts holding it", () => {
    const spread = getFundSpreadAcrossAccounts({ ...input, fundId: "house" });
    expect(spread.get("checking")).toBe(100);
    expect(spread.has("savings")).toBe(false);
  });

  it("a subtree spreads across accounts as the sum of its funds", () => {
    // Kitchen is a house subfund claiming 50 more of the checking account
    const treeInput = {
      ...input,
      funds: [
        ...funds,
        { ...fund("kitchen", "house"), startDate: new Date("2026-01-01") },
      ],
      fundAllocations: [
        ...fundAllocations,
        allocation("a2", "kitchen", "checking", 50),
      ],
    };

    const tree = getFundTreeSpreadAcrossAccounts({
      ...treeInput,
      fundId: "house",
      date: new Date("2026-01-31"),
    });
    expect(tree.get("checking")).toBe(150);

    // The direct spread stays the fund's own money
    const direct = getFundSpreadAcrossAccounts({
      ...treeInput,
      fundId: "house",
      date: new Date("2026-01-31"),
    });
    expect(direct.get("checking")).toBe(100);
  });

  it("an account spreads across the funds claiming it", () => {
    const checking = getAccountSpreadAcrossFunds({
      ...input,
      accountId: "checking",
    });
    expect(checking.get("house")).toBe(100);
    expect(checking.get(null)).toBe(600);

    const savings = getAccountSpreadAcrossFunds({
      ...input,
      accountId: "savings",
    });
    expect(savings.get(null)).toBe(300);
  });

  it("p&l accounts hold no positions", () => {
    const expense = account("groceries", 0, AccountType.EXPENSE);
    const spread = getAccountSpreadAcrossFunds({
      ...input,
      accounts: [...accounts, expense],
      accountId: "groceries",
    });
    expect([...spread.values()].reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe("default fund classification (ui logic)", () => {
  // Checking: 700 house, 200 liquid, 100 untracked; savings: 300 house;
  // cash: entirely untracked; groceries: an expense account.
  const accounts = [
    account("checking", 1000),
    account("savings", 0),
    account("cash", 50),
    account("groceries", 0, AccountType.EXPENSE),
  ];
  const funds = [fund("house"), fund("liquid")];
  const fundAllocations = [
    allocation("a1", "house", "checking", 700),
    allocation("a2", "liquid", "checking", 200),
    allocation("a3", "house", "savings", 300),
  ];
  const startingDate = new Date("2025-01-01");

  const defaultFundByAccount = getDefaultFundByAccount({
    accounts,
    activities: [],
    funds,
    fundAllocations,
    startingDate,
  });

  it("an account's default fund is the one holding the most of it", () => {
    expect(defaultFundByAccount.get("checking")).toBe("house");
    expect(defaultFundByAccount.get("savings")).toBe("house");
    expect(defaultFundByAccount.get("cash")).toBe(null);
    // The expense account holds no position at all
    expect(defaultFundByAccount.get("groceries")).toBe(undefined);
  });

  it("a balance-to-balance transaction pins both sides to their defaults", () => {
    const moves = classifyFundMoves({
      fromAccount: "checking",
      toAccount: "savings",
      amount: 100,
      accounts,
      defaultFundByAccount,
      date: new Date("2026-01-15"),
    });
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({
      fromFund: "house",
      toFund: "house",
      amount: 100,
      note: null,
      // Fund moves date with their activity, never the staging moment
      date: new Date("2026-01-15"),
    });
  });

  it("an expense side stays out of the classification", () => {
    const moves = classifyFundMoves({
      fromAccount: "checking",
      toAccount: "groceries",
      amount: 100,
      accounts,
      defaultFundByAccount,
      date: new Date("2026-01-15"),
    });
    expect(moves).toHaveLength(1);
    expect(moves[0].fromFund).toBe("house");
    expect(moves[0].toFund).toBe(null);
  });

  it("money between unclassified accounts stays untracked (no leg)", () => {
    const moves = classifyFundMoves({
      fromAccount: "cash",
      toAccount: "groceries",
      amount: 100,
      accounts,
      defaultFundByAccount,
      date: new Date("2026-01-15"),
    });
    expect(moves).toHaveLength(0);
  });
});

describe("transaction side funds (ui logic)", () => {
  it("reads the from fund when the account sends", () => {
    const t = transaction("t1", 10, "checking", "expense", [
      move({ id: "m1", fromFund: "house", amount: 10 }),
    ]);
    expect(getTransactionSideFund(t, "checking")).toBe("house");
  });

  it("reads the to fund when the account receives", () => {
    const t = transaction("t2", 10, "revenue", "checking", [
      move({ id: "m2", toFund: "house", amount: 10 }),
    ]);
    expect(getTransactionSideFund(t, "checking")).toBe("house");
  });

  it("is untracked without legs or when the account is not on a side", () => {
    expect(
      getTransactionSideFund(
        transaction("t3", 10, "checking", "expense"),
        "checking",
      ),
    ).toBeNull();
    expect(
      getTransactionSideFund(
        transaction("t4", 10, "savings", "expense"),
        "checking",
      ),
    ).toBeNull();
  });
});

describe("activity fund touches (ui logic)", () => {
  it("touches a fund named on either side of any leg", () => {
    const a = activity("a1", "2026-01-10", [
      transaction("t1", 10, "checking", "expense", [
        move({ id: "m1", toFund: "house", amount: 10 }),
      ]),
    ]);
    expect(activityTouchesFund(a, "house")).toBe(true);
    expect(activityTouchesFund(a, "car")).toBe(false);
  });

  it("touches untracked when a transaction has no legs", () => {
    const a = activity("a2", "2026-01-10", [
      transaction("t2", 10, "checking", "expense"),
    ]);
    expect(activityTouchesFund(a, null)).toBe(true);
    expect(activityTouchesFund(a, "house")).toBe(false);
  });

  it("touches untracked when a leg leaves a side unnamed", () => {
    const a = activity("a3", "2026-01-10", [
      transaction("t3", 10, "unclassified", "house", [
        move({ id: "m3", fromFund: null, toFund: "house", amount: 10 }),
      ]),
    ]);
    expect(activityTouchesFund(a, null)).toBe(true);
  });

  it("does not touch untracked when every leg names both sides", () => {
    const a = activity("a4", "2026-01-10", [
      transaction("t4", 10, "checking", "savings", [
        move({ id: "m4", fromFund: "house", toFund: "car", amount: 10 }),
      ]),
    ]);
    expect(activityTouchesFund(a, null)).toBe(false);
    expect(activityTouchesFund(a, "house")).toBe(true);
    expect(activityTouchesFund(a, "car")).toBe(true);
  });

  it("touches when any of the activity's transactions does", () => {
    const a = activity("a5", "2026-01-10", [
      transaction("t5", 10, "checking", "expense"),
      transaction("t6", 10, "revenue", "savings", [
        move({ id: "m6", toFund: "house", amount: 10 }),
      ]),
    ]);
    expect(activityTouchesFund(a, "house")).toBe(true);
    expect(activityTouchesFund(a, null)).toBe(true);
  });
});

describe("flattenActivityFundMoves (ui logic)", () => {
  it("collects the legs of every transaction of every activity", () => {
    const leg1 = move({ id: "m1", fromFund: "house", amount: 100 });
    const leg2 = move({ id: "m2", toFund: "car", amount: 50 });
    const activities = [
      activity("act-1", "2026-01-05", [
        transaction("t1", 100, "checking", "savings", [leg1]),
        transaction("t2", 50, "revenue", "checking"),
      ]),
      activity("act-2", "2026-02-05", [
        transaction("t3", 50, "checking", "savings", [leg2]),
      ]),
    ];

    expect(flattenActivityFundMoves(activities)).toEqual([
      { ...leg1, transaction: "t1" },
      { ...leg2, transaction: "t3" },
    ]);
  });

  it("keeps a leg's own transaction reference when it has one", () => {
    const leg = move({
      id: "m1",
      fromFund: "house",
      amount: 100,
      transaction: "elsewhere",
    });
    const activities = [
      activity("act-1", "2026-01-05", [
        transaction("t1", 100, "checking", "savings", [leg]),
      ]),
    ];

    expect(flattenActivityFundMoves(activities)).toEqual([
      { ...leg, transaction: "elsewhere" },
    ]);
  });
});
