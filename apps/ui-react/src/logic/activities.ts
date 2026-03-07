import type { ActivityType, Activity } from "@maille/core/activities";

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
    .filter((a) => a.date.getMonth() === monthDate.getMonth())
    .reduce((acc, a) => acc + a.amount, 0);
}
