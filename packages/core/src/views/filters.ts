import { add, isAfter, isBefore, isEqual, startOfDay, sub } from "date-fns";

import type { TransactionFilter } from "./types";

/** The subset of a transaction row that filters read. */
export type TransactionFilterRow = {
  date: Date;
  amount: number;
  /** "zero" is a transfer inside the balance sheet; no direction filter matches it. */
  direction: "in" | "out" | "zero";
  status: string;
};

/** The presets a date filter's value can hold, shared with activities. */
export const TransactionFilterDateValues = [
  "today",
  "1 day ago",
  "2 days ago",
  "3 days ago",
  "1 week ago",
  "2 weeks ago",
  "3 weeks ago",
  "1 month ago",
  "2 months ago",
  "3 months ago",
  "6 months ago",
  "1 day from now",
  "2 days from now",
  "3 days from now",
  "1 week from now",
  "2 weeks from now",
  "3 weeks from now",
  "1 month from now",
  "2 months from now",
  "3 months from now",
  "6 months from now",
] as const;

export const TransactionFilterDateOperators = ["before", "after"] as const;

export const TransactionFilterAmountOperators = [
  "equal",
  "not equal",
  "greater",
  "less",
  "greater or equal",
  "less or equal",
] as const;

export const TransactionFilterIsOperators = ["is", "is not"] as const;

export const TransactionFilterMultipleOperators = ["is any of", "is not"] as const;

const parseDateValue = (value: string, now: Date): Date => {
  let comparator = startOfDay(now);
  if (value.includes("ago")) {
    const [number, period] = value.split(" ");
    // date-fns durations use plural keys ("days", "weeks", "months"); the
    // preset values use the singular for single units ("1 day ago").
    const durationKey = period!.endsWith("s") ? period! : `${period}s`;
    comparator = sub(comparator, {
      [durationKey]: parseInt(number!),
    } as Record<string, number>);
  } else if (value.includes("from now")) {
    const [number, period] = value.split(" ");
    const durationKey = period!.endsWith("s") ? period! : `${period}s`;
    comparator = add(comparator, {
      [durationKey]: parseInt(number!),
    } as Record<string, number>);
  }
  return comparator;
};

export function verifyTransactionFilter(
  filter: TransactionFilter,
  row: TransactionFilterRow,
  now: Date = new Date(),
): boolean {
  if (filter.operator === undefined || filter.value === undefined) return true;

  if (filter.field === "date") {
    const comparator = parseDateValue(filter.value, now);
    if (filter.operator === "before") {
      return isBefore(row.date, comparator) || isEqual(row.date, comparator);
    }
    return isAfter(row.date, comparator) || isEqual(row.date, comparator);
  }

  if (filter.field === "amount") {
    switch (filter.operator) {
      case "less":
        return row.amount < filter.value;
      case "less or equal":
        return row.amount <= filter.value;
      case "equal":
        return row.amount === filter.value;
      case "not equal":
        return row.amount !== filter.value;
      case "greater or equal":
        return row.amount >= filter.value;
      case "greater":
        return row.amount > filter.value;
    }
  }

  if (filter.field === "direction") {
    if (filter.operator === "is") return row.direction === filter.value;
    return row.direction !== filter.value;
  }

  if (filter.field === "status") {
    if (filter.operator === "is any of") {
      return filter.value.length > 0 ? filter.value.includes(row.status) : true;
    }
    return filter.value.length > 0 ? !filter.value.includes(row.status) : true;
  }

  return true;
}
