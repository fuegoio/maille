import type { Account } from "@maille/core/accounts";
import type { Movement } from "@maille/core/movements";

import type { ViewDescriptor } from "@/types/views";

import {
  DATE_GROUPINGS,
  directionGroup,
  accountGroup,
  statusGroup,
  type GroupAccessors,
} from "@/lib/view-grouping";

export const MOVEMENT_VIEW_FIELDS = [
  "date",
  "status",
  "account",
  "name",
  "amount",
] as const;
export const movementViewDescriptor: ViewDescriptor = {
  fields: [
    { value: "date", text: "Date" },
    { value: "status", text: "Status" },
    { value: "account", text: "Account" },
    { value: "name", text: "Name", locked: true },
    { value: "amount", text: "Amount" },
  ],
  orderings: [
    { value: "date", text: "Date" },
    { value: "name", text: "Name" },
    { value: "amount", text: "Amount" },
  ],
  groupings: [
    ...DATE_GROUPINGS,
    { value: "status", text: "Status" },
    { value: "account", text: "Account" },
    { value: "direction", text: "Direction" },
  ],
};
export const movementOrderingAccessors = {
  id: (row: Movement) => row.id,
  date: (row: Movement) => row.date,
  name: (row: Movement) => row.name,
  amount: (row: Movement) => row.amount,
};
export function movementGroupAccessors(
  accounts: Pick<Account, "id" | "name" | "type">[],
): GroupAccessors<Movement> {
  return {
    status: (row) => statusGroup(row.status),
    account: (row) =>
      accountGroup(
        row.account,
        accounts.find((account) => account.id === row.account),
        "Unknown account",
      ),
    direction: (row) =>
      directionGroup(row.amount > 0 ? "in" : row.amount < 0 ? "out" : "zero"),
  };
}
