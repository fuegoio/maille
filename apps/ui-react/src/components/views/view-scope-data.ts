import type { Activity } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";
import type { ViewScope } from "@maille/core/views";

import * as React from "react";

import type { TransactionViewFilter } from "@/components/transactions/transaction-view";

import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";

const inMonth = (date: Date, month: number, year: number): boolean =>
  date.getFullYear() === year && date.getMonth() === month - 1;

/** The activities a custom view over this scope displays. */
export function useScopedActivities(scope: ViewScope | null): Activity[] {
  const activities = useActivities((state) => state.activities);
  return React.useMemo(() => {
    if (scope?.kind === "month") {
      return activities.filter((activity) =>
        inMonth(activity.date, scope.month, scope.year),
      );
    }
    if (scope?.kind === "category") {
      return activities.filter(
        (activity) => activity.category === scope.categoryId,
      );
    }
    if (scope?.kind === "project") {
      return activities.filter(
        (activity) => activity.project === scope.projectId,
      );
    }
    return activities;
  }, [activities, scope]);
}

/** The movements a custom view over this scope displays. */
export function useScopedMovements(scope: ViewScope | null): Movement[] {
  const movements = useMovements((state) => state.movements);
  return React.useMemo(() => {
    if (scope?.kind === "month") {
      return movements.filter((movement) =>
        inMonth(movement.date, scope.month, scope.year),
      );
    }
    if (scope?.kind === "account") {
      return movements.filter(
        (movement) => movement.account === scope.accountId,
      );
    }
    return movements;
  }, [movements, scope]);
}

/** The side a custom transactions view over this scope displays. */
export function scopedTransactionsFilter(
  scope: ViewScope | null,
): TransactionViewFilter {
  if (scope?.kind === "account") {
    return { kind: "account", accountId: scope.accountId };
  }
  if (scope?.kind === "fund") {
    return { kind: "fund", fundId: scope.fundId };
  }
  return { kind: "fund", fundId: null };
}
