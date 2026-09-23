import type { Account } from "@maille/core/accounts";
import type { Activity, Transaction } from "@maille/core/activities";
import type { Fund, FundMove } from "@maille/core/funds";

import { AccountType } from "@maille/core/accounts";
import { getFundDescendants } from "@maille/core/funds";

import type { ViewDescriptor } from "@/types/views";

import {
  DATE_GROUPINGS,
  accountGroup,
  fundGroup,
  type RowGroup,
  directionGroup,
  namedGroup,
  statusGroup,
  type GroupAccessors,
} from "@/lib/view-grouping";
import { assetTransactions } from "@/logic/assets";
import { getTransactionSideFund, isLegNullSideUntracked } from "@/logic/funds";

/**
 * A transaction as seen from a view's side: one account (the account
 * pages) or one fund, Untracked included (the fund pages). Every page
 * shows the same rows; only the filter picking them differs.
 */
export type TransactionRow = {
  id: string;
  date: Date;
  activity: Activity;
  /** Read from the view's side; "zero" is a transfer inside the balance sheet. */
  direction: "in" | "out" | "zero";
  counterpart: TransactionCounterpart;
  fund: string | null;
  fundIds: (string | null)[];
  amount: number;
};

/** Whom the money moves to or from, as the row displays it. */
export type TransactionCounterpart =
  | { kind: "account"; account: string }
  | { kind: "fund"; fund: string }
  /** The Expense or Revenue account beyond the balance sheet. */
  | { kind: "external"; account: string }
  | { kind: "untracked" };

/**
 * What a transactions table shows: one account's transactions, the
 * transactions crossing a fund's (or Untracked's, or a fund subtree's)
 * boundary, or every transaction of a month.
 */
export type TransactionViewFilter =
  | {
      kind: "month";
      /** 1-12, like the month pages' scope. */
      month: number;
      year: number;
    }
  | {
      kind: "account";
      accountId: string;
      /** Keep only transactions holding this fund on the account's side; null is Untracked. */
      fundFilter?: string | null;
    }
  | {
      kind: "asset";
      assetId: string;
    }
  | {
      kind: "fund";
      /** The fund whose boundary transactions to show; null is Untracked. */
      fundId: string | null;
      /** Show the whole subtree's boundary, not just the fund's own. */
      subtree?: boolean;
      /** Only show transactions touching this account. */
      accountFilter?: string | null;
    };

export const TRANSACTION_VIEW_FIELDS = [
  "date",
  "status",
  "name",
  "counterpart",
  "amount",
] as const;
export const transactionViewDescriptor: ViewDescriptor = {
  fields: [
    { value: "date", text: "Date" },
    { value: "status", text: "Status" },
    { value: "name", text: "Activity", locked: true },
    { value: "counterpart", text: "Counterpart" },
    { value: "amount", text: "Amount" },
  ],
  orderings: [
    { value: "date", text: "Date" },
    { value: "name", text: "Activity" },
    { value: "amount", text: "Amount" },
  ],
  groupings: [
    ...DATE_GROUPINGS,
    { value: "status", text: "Status" },
    { value: "activity", text: "Activity" },
    { value: "direction", text: "Direction" },
    { value: "counterpart", text: "Counterpart" },
    { value: "fund", text: "Fund" },
  ],
};
export const transactionOrderingAccessors = {
  id: (row: TransactionRow) => row.id,
  date: (row: TransactionRow) => row.date,
  name: (row: TransactionRow) => row.activity.name,
  amount: (row: TransactionRow) =>
    row.direction === "out"
      ? -row.amount
      : row.direction === "zero"
        ? 0
        : row.amount,
};
export function transactionGroupAccessors(
  accounts: Pick<Account, "id" | "name" | "type">[],
  funds: { id: string; name: string; color?: string }[],
): GroupAccessors<TransactionRow> {
  return {
    status: (row) => statusGroup(row.activity.status),
    activity: (row) =>
      namedGroup(row.activity.id, row.activity.name, "No activity", {
        kind: "icon",
        name: "activity",
      }),
    direction: (row) => directionGroup(row.direction),
    counterpart: (row) =>
      transactionCounterpartGroup(row.counterpart, accounts, funds),
    fund: (row) => transactionFundGroup(row, funds),
  };
}

/** The group a row's counterpart resolves to, whatever kind it is. */
export function transactionCounterpartGroup(
  counterpart: TransactionCounterpart,
  accounts: Pick<Account, "id" | "name" | "type">[],
  funds: { id: string; name: string; color?: string }[],
): RowGroup {
  switch (counterpart.kind) {
    case "account":
      return accountGroup(
        counterpart.account,
        accounts.find((account) => account.id === counterpart.account),
        "Unknown account",
      );
    case "fund":
      return fundGroup(
        counterpart.fund,
        funds.find((fund) => fund.id === counterpart.fund),
      );
    case "external": {
      const account = accounts.find(
        (entry) => entry.id === counterpart.account,
      );
      if (!account) return { key: "external:none", label: "Unknown account" };
      return {
        key: `external:${account.id}`,
        label: account.name,
        marker: { kind: "account", type: account.type },
      };
    }
    case "untracked":
      return fundGroup(null, undefined);
  }
}

/** Keep split-fund transactions in one explicit bucket instead of attributing the total to one fund. */
export function accountTransactionFunds(
  transaction: Transaction,
  accountId: string,
): (string | null)[] {
  const legs = (transaction.fundMoves ?? []).filter((move) => move.amount > 0);
  const ids = legs.map((move) =>
    transaction.fromAccount === accountId ? move.fromFund : move.toFund,
  );
  if (transaction.amount > legs.reduce((sum, move) => sum + move.amount, 0))
    ids.push(null);
  return ids.length ? [...new Set(ids)] : [null];
}
export function transactionFundGroup(
  row: Pick<TransactionRow, "fundIds">,
  funds: { id: string; name: string; color?: string }[],
): RowGroup {
  if (row.fundIds.length > 1)
    return {
      key: "mixed",
      label: "Mixed funds",
      marker: { kind: "icon", name: "mixed-funds" },
    };
  const id = row.fundIds[0] ?? null;
  return fundGroup(
    id,
    funds.find((fund) => fund.id === id),
  );
}

/**
 * The rows of a transactions table: every transaction touching the
 * filter's side, seen from that side. Money crossing a fund scope's
 * boundary is a row; transactions between funds inside it cancel out
 * of the boundary, like the summary's flows.
 */
export function buildTransactionRows(
  activities: Activity[],
  filter: TransactionViewFilter,
  accounts: Pick<Account, "id" | "name" | "type">[],
  funds: Fund[],
): TransactionRow[] {
  if (filter.kind === "account") {
    return buildAccountTransactionRows(activities, filter);
  }
  if (filter.kind === "asset") {
    return buildAssetTransactionRows(activities, filter);
  }
  if (filter.kind === "month") {
    return buildMonthTransactionRows(activities, filter, accounts);
  }
  return buildFundTransactionRows(activities, filter, accounts, funds);
}

/**
 * The month's transactions, each read once from the balance sheet's
 * side: money arriving from a Revenue account flows in, money reaching
 * an Expense account flows out, and transfers between balance accounts
 * stay neutral — they never enter or leave the balance sheet.
 */
function buildMonthTransactionRows(
  activities: Activity[],
  filter: Extract<TransactionViewFilter, { kind: "month" }>,
  accounts: Pick<Account, "id" | "type">[],
): TransactionRow[] {
  const result: TransactionRow[] = [];

  const isBalanceAccount = (accountId: string): boolean => {
    const type = accounts.find((account) => account.id === accountId)?.type;
    return type !== AccountType.EXPENSE && type !== AccountType.REVENUE;
  };

  for (const activity of activities) {
    if (
      activity.date.getFullYear() !== filter.year ||
      activity.date.getMonth() !== filter.month - 1
    ) {
      continue;
    }
    for (const transaction of activity.transactions) {
      // The counterpart is the side the balance sheet does not hold:
      // the outside on revenue and expense transactions, the receiving
      // account on internal transfers.
      const fromIsBalance = isBalanceAccount(transaction.fromAccount);
      const toIsBalance = isBalanceAccount(transaction.toAccount);
      const direction: TransactionRow["direction"] = !fromIsBalance
        ? "in"
        : toIsBalance
          ? "zero"
          : "out";

      // Every fund the transaction's legs touch, Untracked included;
      // an unallocated remainder reads as Untracked too.
      const legs = (transaction.fundMoves ?? []).filter(
        (move) => move.amount > 0,
      );
      const fundIds = [
        ...new Set(legs.flatMap((move) => [move.fromFund, move.toFund])),
      ];
      if (
        transaction.amount > legs.reduce((sum, move) => sum + move.amount, 0)
      ) {
        fundIds.push(null);
      }

      result.push({
        id: transaction.id,
        date: activity.date,
        activity,
        direction,
        counterpart: {
          kind: "account",
          account:
            direction === "out"
              ? transaction.toAccount
              : direction === "in"
                ? transaction.fromAccount
                : transaction.toAccount,
        },
        fund: fundIds[0] ?? null,
        fundIds: fundIds.length > 0 ? fundIds : [null],
        amount: transaction.amount,
      });
    }
  }

  return result;
}

function buildAccountTransactionRows(
  activities: Activity[],
  filter: Extract<TransactionViewFilter, { kind: "account" }>,
): TransactionRow[] {
  const { accountId, fundFilter } = filter;
  const result: TransactionRow[] = [];

  for (const activity of activities) {
    for (const transaction of activity.transactions) {
      let direction: "in" | "out" | null = null;
      if (transaction.toAccount === accountId) direction = "in";
      else if (transaction.fromAccount === accountId) direction = "out";
      if (direction === null) continue;

      const row: TransactionRow = {
        id: transaction.id,
        date: activity.date,
        activity,
        direction,
        counterpart: {
          kind: "account",
          account:
            direction === "in"
              ? transaction.fromAccount
              : transaction.toAccount,
        },
        fund: getTransactionSideFund(transaction, accountId),
        fundIds: accountTransactionFunds(transaction, accountId),
        amount: transaction.amount,
      };
      // fundFilter undefined keeps everything; null is Untracked.
      if (fundFilter === undefined || row.fund === fundFilter) {
        result.push(row);
      }
    }
  }

  return result;
}

function buildAssetTransactionRows(
  activities: Activity[],
  filter: Extract<TransactionViewFilter, { kind: "asset" }>,
): TransactionRow[] {
  const { assetId } = filter;

  return assetTransactions(activities, assetId).map(
    ({ activity, transaction, direction }) => {
      // The asset rides on one side of the leg; funds read from that
      // side's account, the counterpart from the other one.
      const sideAccount =
        direction === "in" ? transaction.toAccount : transaction.fromAccount;

      return {
        id: transaction.id,
        date: activity.date,
        activity,
        direction,
        counterpart: {
          kind: "account",
          account:
            direction === "in"
              ? transaction.fromAccount
              : transaction.toAccount,
        },
        fund: getTransactionSideFund(transaction, sideAccount),
        fundIds: accountTransactionFunds(transaction, sideAccount),
        amount: transaction.amount,
      };
    },
  );
}

function buildFundTransactionRows(
  activities: Activity[],
  filter: Extract<TransactionViewFilter, { kind: "fund" }>,
  accounts: Pick<Account, "id" | "name" | "type">[],
  funds: Fund[],
): TransactionRow[] {
  const { fundId, subtree = false, accountFilter = null } = filter;
  const result: TransactionRow[] = [];

  for (const activity of activities) {
    for (const transaction of activity.transactions) {
      if (
        accountFilter !== null &&
        transaction.fromAccount !== accountFilter &&
        transaction.toAccount !== accountFilter
      ) {
        continue;
      }

      // Fund moves live on their transactions; the scope's boundary
      // legs decide which transactions are rows, and how they read.
      const legs = fundScopeLegs(
        transaction,
        { fundId, subtree },
        accounts,
        funds,
      );
      if (legs.length === 0) continue;

      const fundIds = [...new Set(legs.map((leg) => leg.fund))];
      result.push({
        id: transaction.id,
        date: activity.date,
        activity,
        direction: legs[0].direction,
        counterpart: legs[0].counterpart,
        fund: fundIds[0] ?? null,
        fundIds,
        amount: transaction.amount,
      });
    }
  }

  return result;
}

/** A fund scope: one fund, its subtree, or Untracked (null). */
export type FundScope = {
  fundId: string | null;
  subtree: boolean;
};

/**
 * A transaction's legs crossing a fund scope's boundary, each read
 * from the scope's side: which side of the leg is the scope's, whether
 * money flows in or out, and who it moves to or from.
 */
export type FundScopeLeg = {
  leg: FundMove;
  direction: "in" | "out";
  /** The scope's side of the leg; Untracked legs carry null. */
  fund: string | null;
  /** The scope's side of the leg, by field name. */
  side: "fromFund" | "toFund";
  counterpart: TransactionCounterpart;
};

/**
 * The legs of a transaction crossing a fund scope's boundary. A leg
 * crosses when exactly one of its sides is the scope: money moved
 * between the fund and somewhere else. Untracked lists the null side
 * of every move; a null side facing an Expense or Revenue account is
 * the outside of the balance sheet, not Untracked, and stays off.
 */
export function fundScopeLegs(
  transaction: Transaction,
  scope: FundScope,
  accounts: Pick<Account, "id" | "name" | "type">[],
  funds: Fund[],
): FundScopeLeg[] {
  const legs = transaction.fundMoves ?? [];
  if (scope.fundId === null) {
    const result: FundScopeLeg[] = [];
    for (const leg of legs) {
      if (leg.fromFund !== null && leg.toFund !== null) continue;
      if (!isLegNullSideUntracked(leg, transaction, accounts)) continue;

      // The null side is the scope's: money reaching it came in,
      // money leaving it went out. Both sides null stay internal.
      const side: "fromFund" | "toFund" =
        leg.toFund === null ? "toFund" : "fromFund";
      const otherFund = leg.toFund === null ? leg.fromFund : leg.toFund;
      result.push({
        leg,
        direction: leg.toFund === null ? "in" : "out",
        fund: null,
        side,
        counterpart:
          otherFund !== null
            ? { kind: "fund", fund: otherFund }
            : { kind: "untracked" },
      });
    }
    return result;
  }

  const scopeIds = new Set(
    scope.subtree
      ? [scope.fundId, ...getFundDescendants(scope.fundId, funds)]
      : [scope.fundId],
  );
  const result: FundScopeLeg[] = [];
  for (const leg of legs) {
    const fromInside = leg.fromFund !== null && scopeIds.has(leg.fromFund);
    const toInside = leg.toFund !== null && scopeIds.has(leg.toFund);
    if (fromInside === toInside) continue;

    const insideFund = fromInside ? leg.fromFund : leg.toFund;
    const otherFund = fromInside ? leg.toFund : leg.fromFund;
    result.push({
      leg,
      direction: toInside ? "in" : "out",
      fund: insideFund,
      side: fromInside ? "fromFund" : "toFund",
      counterpart:
        otherFund !== null
          ? { kind: "fund", fund: otherFund }
          : nullSideCounterpart(
              fromInside ? transaction.toAccount : transaction.fromAccount,
              accounts,
            ),
    });
  }
  return result;
}

/**
 * Who a leg's null side is, from the scope's side: an Expense or
 * Revenue account is the outside of the balance sheet; any other
 * account holds Untracked money.
 */
function nullSideCounterpart(
  accountId: string,
  accounts: Pick<Account, "id" | "name" | "type">[],
): TransactionCounterpart {
  const account = accounts.find((entry) => entry.id === accountId);
  if (
    account &&
    (account.type === AccountType.EXPENSE ||
      account.type === AccountType.REVENUE)
  ) {
    return { kind: "external", account: account.id };
  }
  return { kind: "untracked" };
}
