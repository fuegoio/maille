import type { FundMove } from "@maille/core/funds";

import { AccountType, type Account } from "@maille/core/accounts";

import type { ViewDescriptor } from "@/types/views";

import {
  DATE_GROUPINGS,
  directionGroup,
  namedGroup,
  type GroupAccessors,
} from "@/lib/view-grouping";

export type FundMoveWithActivity = FundMove & {
  kind: "move";
  direction: "in" | "out";
  activity: { id: string; name: string } | null;
  accounts: { from: string; to: string } | null;
  own?: string;
};
export const FUND_MOVE_VIEW_FIELDS = [
  "date",
  "name",
  "own",
  "counterpart",
  "note",
  "accounts",
  "amount",
] as const;
export const fundMoveViewDescriptor: ViewDescriptor = {
  fields: [
    { value: "date", text: "Date" },
    { value: "name", text: "Activity", locked: true },
    { value: "own", text: "Subfund" },
    { value: "counterpart", text: "Counterpart" },
    { value: "note", text: "Note" },
    { value: "accounts", text: "Accounts" },
    { value: "amount", text: "Amount" },
  ],
  orderings: [
    { value: "date", text: "Date" },
    { value: "name", text: "Activity" },
    { value: "amount", text: "Amount" },
  ],
  groupings: [
    ...DATE_GROUPINGS,
    { value: "direction", text: "Direction" },
    { value: "activity", text: "Activity" },
    { value: "own", text: "Fund / subfund" },
    { value: "counterpart", text: "Counterpart fund" },
    { value: "fromFund", text: "From fund" },
    { value: "toFund", text: "To fund" },
    { value: "fromAccount", text: "From account" },
    { value: "toAccount", text: "To account" },
  ],
};
export const fundMoveOrderingAccessors = {
  id: (row: FundMoveWithActivity) => row.id,
  date: (row: FundMoveWithActivity) => row.date,
  name: (row: FundMoveWithActivity) => row.activity?.name ?? "",
  amount: (row: FundMoveWithActivity) =>
    row.direction === "in" ? row.amount : -row.amount,
};
export function fundMoveGroupAccessors(
  accounts: Pick<Account, "id" | "name" | "type">[],
  funds: { id: string; name: string }[],
): GroupAccessors<FundMoveWithActivity> {
  const fundGroup = (row: FundMoveWithActivity, side: "from" | "to") =>
    fundMoveFundGroup(row, side, accounts, funds);
  const accountGroup = (id: string | undefined) =>
    namedGroup(
      id,
      accounts.find((account) => account.id === id)?.name,
      "No account",
    );
  return {
    direction: (row) => directionGroup(row.direction),
    activity: (row) =>
      namedGroup(row.activity?.id, row.activity?.name, "No activity"),
    own: (row) => fundGroup(row, row.direction === "in" ? "to" : "from"),
    counterpart: (row) =>
      fundGroup(row, row.direction === "in" ? "from" : "to"),
    fromFund: (row) => fundGroup(row, "from"),
    toFund: (row) => fundGroup(row, "to"),
    fromAccount: (row) => accountGroup(row.accounts?.from),
    toAccount: (row) => accountGroup(row.accounts?.to),
  };
}

export function fundMoveFundGroup(
  row: FundMoveWithActivity,
  side: "from" | "to",
  accounts: Pick<Account, "id" | "name" | "type">[],
  funds: { id: string; name: string }[],
) {
  const id = side === "from" ? row.fromFund : row.toFund;
  const account = accounts.find((entry) => entry.id === row.accounts?.[side]);
  if (
    id === null &&
    account &&
    (account.type === AccountType.EXPENSE ||
      account.type === AccountType.REVENUE)
  ) {
    return { key: `external:${account.id}`, label: account.name };
  }
  return namedGroup(
    id,
    funds.find((fund) => fund.id === id)?.name,
    id === null ? "Untracked" : "Unknown fund",
  );
}
