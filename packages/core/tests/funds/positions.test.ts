import type { Account } from "@maille/core/accounts";
import type { Fund, FundAllocation, FundMove } from "@maille/core/funds";
import type { Transaction } from "@maille/core/activities";

import { AccountType } from "@maille/core/accounts";
import { describe, expect, it } from "vitest";

import {
  computePositions,
  getAllocationDate,
  getFundAccountPositions,
  getFundBalance,
  getFundTreeBalance,
  getTotalFundsBalance,
  getUntrackedByAccountAtDate,
  type PositionsInput,
} from "@maille/core/funds";

const account = (
  id: string,
  type: AccountType = AccountType.BANK_ACCOUNT,
  startingBalance = 0,
): Pick<Account, "id" | "type" | "startingBalance"> => ({
  id,
  type,
  startingBalance,
});

const fund = (id: string, startDate: Date | null = null): Fund => ({
  id,
  name: id,
  color: "#818cf8",
  startDate,
  endDate: null,
  parentFund: null,
});

const allocation = (
  id: string,
  fundId: string,
  accountId: string,
  amount: number,
): FundAllocation => ({ id, fund: fundId, account: accountId, amount });

const leg = (id: string, partial: Partial<Omit<FundMove, "id">>): FundMove => ({
  fromFund: null,
  toFund: null,
  amount: 0,
  date: new Date("2026-01-01"),
  note: null,
  transaction: null,
  id,
  ...partial,
});

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

const build = (overrides: Partial<PositionsInput> = {}): PositionsInput => ({
  accounts: [
    account("checking", AccountType.BANK_ACCOUNT, 1000),
    account("savings", AccountType.BANK_ACCOUNT),
  ],
  funds: [fund("vacation"), fund("house")],
  fundAllocations: [],
  activities: [],
  startingDate: new Date("2026-01-01"),
  ...overrides,
});

describe("fund positions", () => {
  it("seeds starting balances as untracked", () => {
    const positions = computePositions(build());
    expect(positions.get("checking")).toEqual(new Map([[null, 1000]]));
    expect(positions.get("savings")).toEqual(new Map([[null, 0]]));
  });

  it("ignores revenue and expense accounts entirely", () => {
    const positions = computePositions(
      build({
        accounts: [
          account("checking"),
          account("groceries", AccountType.EXPENSE),
          account("salary", AccountType.REVENUE),
        ],
      }),
    );
    expect([...positions.keys()]).toEqual(["checking"]);
  });

  it("allocates incoming money to the legged fund, remainder to untracked", () => {
    const positions = computePositions(
      build({
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [
              transaction("t1", 1000, "salary", "checking", [
                leg("m1", { toFund: "vacation", amount: 600 }),
              ]),
            ],
          },
        ],
      }),
    );
    expect(positions.get("checking")).toEqual(
      new Map([
        [null, 1400],
        ["vacation", 600],
      ]),
    );
  });

  it("draws outgoing money from the legged fund, remainder from untracked", () => {
    const positions = computePositions(
      build({
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [
              transaction("t1", 350, "checking", "groceries", [
                leg("m1", { fromFund: "vacation", amount: 300 }),
              ]),
            ],
          },
        ],
        accounts: [
          account("checking", AccountType.BANK_ACCOUNT, 1000),
          account("groceries", AccountType.EXPENSE),
        ],
      }),
    );
    expect(positions.get("checking")).toEqual(
      new Map([
        [null, 950],
        ["vacation", -300],
      ]),
    );
  });

  it("moves unlegged transfers untracked to untracked, earmarks stay put", () => {
    const positions = computePositions(
      build({
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [
              // Fund the vacation with an allocation first: 500 of 1000
              transaction("t1", 500, "checking", "savings"),
            ],
          },
        ],
        fundAllocations: [allocation("a1", "vacation", "checking", 500)],
      }),
    );
    // Unassigned money stays unassigned: the earmark does not follow the
    // transfer, it keeps claiming the source account
    expect(positions.get("checking")).toEqual(
      new Map([
        ["vacation", 500],
        [null, 0],
      ]),
    );
    expect(positions.get("savings")).toEqual(new Map([[null, 500]]));
  });

  it("pins a transfer's fund with a same-fund leg", () => {
    const positions = computePositions(
      build({
        fundAllocations: [allocation("a1", "vacation", "checking", 800)],
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [
              transaction("t1", 300, "checking", "savings", [
                leg("m1", { fromFund: "vacation", toFund: "vacation", amount: 300 }),
              ]),
            ],
          },
        ],
      }),
    );
    expect(positions.get("checking")).toEqual(
      new Map([
        ["vacation", 500],
        [null, 200],
      ]),
    );
    expect(positions.get("savings")).toEqual(
      new Map([
        ["vacation", 300],
        [null, 0],
      ]),
    );
  });

  it("relabels a fund in flight with a from-to transfer leg", () => {
    const positions = computePositions(
      build({
        fundAllocations: [allocation("a1", "vacation", "checking", 800)],
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [
              transaction("t1", 300, "checking", "savings", [
                leg("m1", { fromFund: "vacation", toFund: "house", amount: 300 }),
              ]),
            ],
          },
        ],
      }),
    );
    expect(positions.get("checking")).toEqual(
      new Map([
        ["vacation", 500],
        [null, 200],
      ]),
    );
    expect(positions.get("savings")).toEqual(
      new Map([
        ["house", 300],
        [null, 0],
      ]),
    );
    // The fund's total is untouched by the relabel, and located in accounts
    const vacationSpread = getFundAccountPositions(positions, "vacation");
    expect(vacationSpread).toEqual(new Map([["checking", 500]]));
    const houseSpread = getFundAccountPositions(positions, "house");
    expect(houseSpread).toEqual(new Map([["savings", 300]]));
  });

  it("keeps a legged transfer's remainder untracked on both sides", () => {
    const positions = computePositions(
      build({
        fundAllocations: [allocation("a1", "vacation", "checking", 800)],
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [
              // 200 of the 400 transfer is pinned to vacation: the leg's
              // destination side lands Untracked in savings (+200), and the
              // 200 of unlegged remainder also travels Untracked
              transaction("t1", 400, "checking", "savings", [
                leg("m1", { fromFund: "vacation", amount: 200 }),
              ]),
            ],
          },
        ],
      }),
    );
    expect(positions.get("checking")).toEqual(
      new Map([
        ["vacation", 600],
        [null, 0],
      ]),
    );
    expect(positions.get("savings")).toEqual(new Map([[null, 400]]));
  });

  it("does not spread a fund across accounts without legs", () => {
    const positions = computePositions(
      build({
        fundAllocations: [allocation("a1", "vacation", "checking", 1000)],
        accounts: [account("checking", AccountType.BANK_ACCOUNT, 1000), account("savings")],
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [transaction("t1", 400, "checking", "savings")],
          },
        ],
      }),
    );
    // The unlegged transfer leaves the earmark claiming the source account
    // even as its balance drops; only a leg would move the fund over
    expect(getFundAccountPositions(positions, "vacation")).toEqual(new Map([["checking", 1000]]));
    expect(positions.get("savings")).toEqual(new Map([[null, 400]]));
  });

  it("transfers from an empty account go untracked to untracked", () => {
    const positions = computePositions(
      build({
        accounts: [account("checking"), account("savings", AccountType.BANK_ACCOUNT, 1000)],
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [transaction("t1", 100, "checking", "savings")],
          },
        ],
      }),
    );
    expect(positions.get("checking")).toEqual(new Map([[null, -100]]));
    expect(positions.get("savings")).toEqual(new Map([[null, 1100]]));
  });

  it("ignores transactions with no balance account on either side", () => {
    const positions = computePositions(
      build({
        accounts: [
          account("groceries", AccountType.EXPENSE),
          account("salary", AccountType.REVENUE),
        ],
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [
              transaction("t1", 50, "salary", "groceries", [
                leg("m1", { toFund: "vacation", amount: 50 }),
              ]),
            ],
          },
        ],
      }),
    );
    expect([...positions.values()]).toEqual([]);
  });

  it("keeps the per-account invariant: positions sum to the account balance", () => {
    const input = build({
      fundAllocations: [allocation("a1", "vacation", "checking", 300)],
      activities: [
        {
          date: new Date("2026-01-05"),
          transactions: [
            transaction("t1", 1000, "salary", "checking", [
              leg("m1", { toFund: "house", amount: 700 }),
            ]),
          ],
        },
        {
          date: new Date("2026-01-20"),
          transactions: [
            transaction("t2", 250, "checking", "savings"),
            transaction("t3", 90, "checking", "groceries", [
              leg("m2", { fromFund: "vacation", amount: 90 }),
            ]),
          ],
        },
      ],
      accounts: [
        account("checking", AccountType.BANK_ACCOUNT, 1000),
        account("savings"),
        account("salary", AccountType.REVENUE),
        account("groceries", AccountType.EXPENSE),
      ],
    });
    const positions = computePositions(input);

    // Reproduce the account balances the old ledger logic would compute
    const checkingBalance = 1000 + 1000 - 250 - 90;
    const savingsBalance = 250;
    const sum = (composition: Map<string | null, number>) =>
      [...composition.values()].reduce((total, value) => total + value, 0);

    expect(sum(positions.get("checking")!)).toBeCloseTo(checkingBalance, 6);
    expect(sum(positions.get("savings")!)).toBeCloseTo(savingsBalance, 6);
  });

  it("keeps the per-fund invariant: positions sum to the fund balance", () => {
    const fundAllocations = [allocation("a1", "vacation", "checking", 300)];
    const input = build({
      fundAllocations,
      activities: [
        {
          date: new Date("2026-01-05"),
          transactions: [
            transaction("t1", 1000, "salary", "checking", [
              leg("m1", { toFund: "house", amount: 700 }),
            ]),
          ],
        },
        {
          date: new Date("2026-01-20"),
          transactions: [
            transaction("t2", 250, "checking", "savings"),
            transaction("t3", 90, "checking", "groceries", [
              leg("m2", { fromFund: "vacation", amount: 90 }),
            ]),
          ],
        },
      ],
      accounts: [
        account("checking", AccountType.BANK_ACCOUNT, 1000),
        account("savings"),
        account("salary", AccountType.REVENUE),
        account("groceries", AccountType.EXPENSE),
      ],
    });
    const positions = computePositions(input);

    const allMoves = input.activities.flatMap((activity) =>
      activity.transactions.flatMap((t) => t.fundMoves ?? []),
    );
    for (const fundId of ["vacation", "house"]) {
      const positionSum = [...positions.values()].reduce(
        (total, composition) => total + (composition.get(fundId) ?? 0),
        0,
      );
      expect(positionSum).toBeCloseTo(getFundBalance(fundId, allMoves, fundAllocations), 6);
    }
  });
});

describe("fund opening allocations", () => {
  it("claim part of an account's balance for a fund at its start date", () => {
    const positions = computePositions(
      build({
        funds: [fund("vacation", new Date("2026-01-01"))],
        fundAllocations: [allocation("a1", "vacation", "checking", 800)],
      }),
    );
    expect(positions.get("checking")).toEqual(
      new Map([
        [null, 200],
        ["vacation", 800],
      ]),
    );
  });

  it("derives the allocation date from the fund, clamped to the starting date", () => {
    const startingDate = new Date("2026-01-01");
    expect(getAllocationDate(fund("vacation", new Date("2026-03-01")), startingDate)).toEqual(
      new Date("2026-03-01"),
    );
    // A fund starting before the ledger opens opens with the ledger
    expect(getAllocationDate(fund("vacation", new Date("2025-06-01")), startingDate)).toEqual(
      startingDate,
    );
    // No fund start date: the user's starting date
    expect(getAllocationDate(fund("vacation", null), startingDate)).toEqual(startingDate);
  });

  it("applies allocations only after the fund's start date", () => {
    const base = {
      funds: [fund("vacation", new Date("2026-02-01"))],
      fundAllocations: [allocation("a1", "vacation", "checking", 800)],
    };
    const at = (date: Date) => computePositions(build({ ...base, date })).get("checking");

    expect(at(new Date("2026-01-31"))).toEqual(new Map([[null, 1000]]));
    expect(at(new Date("2026-02-01"))).toEqual(
      new Map([
        [null, 200],
        ["vacation", 800],
      ]),
    );
  });

  it("counts allocations in fund balances and the funds total", () => {
    const fundAllocations = [
      allocation("a1", "vacation", "checking", 800),
      allocation("a2", "house", "savings", 200),
    ];
    expect(getFundBalance("vacation", [], fundAllocations)).toBe(800);
    expect(getTotalFundsBalance([], fundAllocations)).toBe(1000);
    // Subtree rollups include the children's allocations
    const parent = fund("goals");
    const child = { ...fund("vacation"), parentFund: "goals" };
    expect(getFundTreeBalance("goals", [parent, child], [], fundAllocations)).toBe(800);
  });

  it("lets validation detect an over-allocation through the untracked replay", () => {
    const base = build({
      funds: [fund("vacation"), fund("house")],
    });

    // Vacation already claims 800 of the 1000 checking balance: the replay
    // sees 200 available for any later allocation
    const withVacation = {
      ...base,
      fundAllocations: [allocation("a1", "vacation", "checking", 800)],
    };
    expect(getUntrackedByAccountAtDate(withVacation).get("checking")).toBe(200);

    // House requesting 500 does not fit: with both applied, Untracked goes
    // negative — exactly what the write path rejects
    const withBoth = {
      ...base,
      fundAllocations: [
        allocation("a1", "vacation", "checking", 800),
        allocation("a2", "house", "checking", 500),
      ],
    };
    expect(getUntrackedByAccountAtDate(withBoth).get("checking")).toBe(-300);
  });
});

describe("positions cutoffs", () => {
  it("replays only events up to the end of the given day", () => {
    const positions = computePositions(
      build({
        activities: [
          {
            date: new Date("2026-01-10"),
            transactions: [transaction("t1", 500, "salary", "checking")],
          },
          {
            date: new Date("2026-02-15"),
            transactions: [transaction("t2", 100, "checking", "savings")],
          },
        ],
        accounts: [account("checking"), account("savings"), account("salary", AccountType.REVENUE)],
        date: new Date("2026-01-31"),
      }),
    );
    expect(positions.get("checking")).toEqual(new Map([[null, 500]]));
    expect(positions.get("savings")).toEqual(new Map([[null, 0]]));
  });

  it("ignores activities dated before the user's starting date", () => {
    const positions = computePositions(
      build({
        startingDate: new Date("2026-01-01"),
        activities: [
          {
            date: new Date("2025-12-20"),
            transactions: [transaction("t0", 500, "salary", "checking")],
          },
          {
            date: new Date("2026-01-10"),
            transactions: [transaction("t1", 100, "salary", "checking")],
          },
        ],
        accounts: [account("checking"), account("salary", AccountType.REVENUE)],
      }),
    );
    expect(positions.get("checking")).toEqual(new Map([[null, 100]]));
  });
});
