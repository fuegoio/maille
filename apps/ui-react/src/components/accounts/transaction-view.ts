import type { Account } from "@maille/core/accounts";
import type { Activity, Transaction } from "@maille/core/activities";

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

/** A transaction as seen from one account. */
export type AccountTransaction = {
  id: string;
  date: Date;
  activity: Activity;
  direction: "in" | "out";
  counterpart: string;
  fund: string | null;
  fundIds: (string | null)[];
  amount: number;
};
export const TRANSACTION_VIEW_FIELDS = [
  "date",
  "status",
  "name",
  "counterpart",
  "fund",
  "amount",
] as const;
export const transactionViewDescriptor: ViewDescriptor = {
  fields: [
    { value: "date", text: "Date" },
    { value: "status", text: "Status" },
    { value: "name", text: "Activity", locked: true },
    { value: "counterpart", text: "Counterpart" },
    { value: "fund", text: "Fund" },
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
  id: (row: AccountTransaction) => row.id,
  date: (row: AccountTransaction) => row.date,
  name: (row: AccountTransaction) => row.activity.name,
  amount: (row: AccountTransaction) =>
    row.direction === "in" ? row.amount : -row.amount,
};
export function transactionGroupAccessors(
  accounts: Pick<Account, "id" | "name" | "type">[],
  funds: { id: string; name: string; color?: string }[],
): GroupAccessors<AccountTransaction> {
  return {
    status: (row) => statusGroup(row.activity.status),
    activity: (row) =>
      namedGroup(row.activity.id, row.activity.name, "No activity", {
        kind: "icon",
        name: "activity",
      }),
    direction: (row) => directionGroup(row.direction),
    counterpart: (row) =>
      accountGroup(
        row.counterpart,
        accounts.find((account) => account.id === row.counterpart),
        "Unknown account",
      ),
    fund: (row) => transactionFundGroup(row, funds),
  };
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
  row: Pick<AccountTransaction, "fundIds">,
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
