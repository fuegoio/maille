import type { ActivityType, Activity } from "@maille/core/activities";

export function getActivityCategoryTotalForMonth({
  monthDate,
  categoryId,
  activities,
}: {
  monthDate: Date;
  categoryId: string;
  activities: Activity[];
}) {
  return activities
    .filter((a) => a.category === categoryId)
    .filter(
      (a) =>
        a.date.getMonth() === monthDate.getMonth() &&
        a.date.getFullYear() === monthDate.getFullYear(),
    )
    .reduce((acc, a) => acc + a.amount, 0);
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
    .filter((a) => a.type === activityType)
    .filter(
      (a) =>
        a.date.getMonth() === monthDate.getMonth() &&
        a.date.getFullYear() === monthDate.getFullYear(),
    )
    .reduce((acc, a) => acc + a.amount, 0);
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
    .filter((a) => a.type === activityType)
    .reduce((acc, a) => acc + a.amount, 0);
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
    type: activity.type,
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
