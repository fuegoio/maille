import type { ActivityType, Activity } from "@maille/core/activities";

import {
  verifyActivityFilter,
  type ActivityFilter,
} from "@maille/core/activities";

import { searchCompare } from "@/lib/strings";
import { activityTouchesFund } from "@/logic/funds";

export function getActivityCategoryTotalForMonth({
  monthDate,
  categoryId,
  activityType,
  activities,
}: {
  monthDate: Date;
  categoryId: string;
  /** The derived type to total; undefined sums the activity totals. */
  activityType?: ActivityType;
  activities: Activity[];
}) {
  return activities
    .filter((a) => a.category === categoryId)
    .filter(
      (a) =>
        a.date.getMonth() === monthDate.getMonth() &&
        a.date.getFullYear() === monthDate.getFullYear(),
    )
    .reduce(
      (acc, a) =>
        acc + (activityType !== undefined ? a.amounts[activityType] : a.amount),
      0,
    );
}

export function getActivityTypeTotalForMonth({
  monthDate,
  activityType,
  activities,
}: {
  monthDate: Date;
  activityType: ActivityType;
  activities: Activity[];
}) {
  return activities
    .filter((a) => a.types.includes(activityType))
    .filter(
      (a) =>
        a.date.getMonth() === monthDate.getMonth() &&
        a.date.getFullYear() === monthDate.getFullYear(),
    )
    .reduce((acc, a) => acc + a.amounts[activityType], 0);
}

export function getActivityTypeTotalForProject({
  projectId,
  activityType,
  activities,
}: {
  projectId: string;
  activityType: ActivityType;
  activities: Activity[];
}) {
  return activities
    .filter((a) => a.project === projectId)
    .filter((a) => a.types.includes(activityType))
    .reduce((acc, a) => acc + a.amounts[activityType], 0);
}

export function duplicateActivities({
  activities,
  generateId = () => crypto.randomUUID(),
}: {
  activities: Activity[];
  generateId?: () => string;
}) {
  return activities.map((activity) => ({
    id: generateId(),
    name: activity.name,
    description: activity.description,
    date: activity.date,
    category: activity.category,
    subcategory: activity.subcategory,
    project: activity.project,
    transactions: activity.transactions.map((transaction) => ({
      id: generateId(),
      amount: transaction.amount,
      fromAccount: transaction.fromAccount,
      fromAsset: transaction.fromAsset ?? null,
      fromCounterparty: transaction.fromCounterparty ?? null,
      toAccount: transaction.toAccount,
      toAsset: transaction.toAsset ?? null,
      toCounterparty: transaction.toCounterparty ?? null,
    })),
  }));
}

/**
 * The single activity filter pipeline, shared by the tables and the
 * analytics panel so both always describe the same set. Tab-level
 * filters follow the tables' conventions: null filters, undefined
 * fund filter is off.
 */
export function applyActivitiesFilters(
  activities: Activity[],
  filters: {
    search?: string;
    viewFilters?: ActivityFilter[];
    accountFilter?: string | null;
    categoryFilter?: string | null;
    subcategoryFilter?: string | null;
    activityTypeFilter?: ActivityType | null;
    /** A fund the activities must touch; null is Untracked, undefined is off. */
    fundFilter?: string | null;
  },
): Activity[] {
  return activities
    .filter((activity) => searchCompare(filters.search ?? "", activity.name))
    .filter((activity) => {
      if (filters.subcategoryFilter != null) {
        return activity.subcategory === filters.subcategoryFilter;
      }
      if (filters.categoryFilter != null) {
        return activity.category === filters.categoryFilter;
      }
      return true;
    })
    .filter((activity) =>
      filters.accountFilter != null
        ? activity.transactions.some(
            (t) =>
              t.toAccount === filters.accountFilter ||
              t.fromAccount === filters.accountFilter,
          )
        : true,
    )
    .filter((activity) =>
      filters.activityTypeFilter != null
        ? activity.types.includes(filters.activityTypeFilter)
        : true,
    )
    .filter((activity) =>
      filters.fundFilter === undefined
        ? true
        : activityTouchesFund(activity, filters.fundFilter),
    )
    .filter((activity) => {
      if (!filters.viewFilters || filters.viewFilters.length === 0) return true;
      return filters.viewFilters
        .map((filter) => verifyActivityFilter(filter, activity))
        .every((f) => f);
    });
}
