import { Link } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { useMemo } from "react";

import { ActivityLine } from "@/components/activities/activity-line";
import { ledgerHeaderClassName } from "@/components/shared/ledger-table";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

const RECENT_COUNT = 8;

/**
 * The latest ledger entries: the most recent activities, rendered by the
 * activities table's own row component so the vocabulary stays identical.
 */
export function RecentActivities() {
  const activities = useActivities((state) => state.activities);

  const recent = useMemo(() => {
    const today = startOfDay(new Date());
    return [...activities]
      .filter((activity) => startOfDay(activity.date) <= today)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, RECENT_COUNT);
  }, [activities]);

  return (
    <section aria-label="Recent activities" className="flex min-w-0 flex-col">
      <div
        className={cn(
          ledgerHeaderClassName,
          "flex h-9 shrink-0 items-center justify-between px-4 lg:px-6",
        )}
      >
        <span>Recent activities</span>
        <Link
          to="/activities"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground lg:px-6">
          No activities yet.
        </p>
      ) : (
        <div>
          {recent.map((activity) => (
            <ActivityLine
              key={activity.id}
              activity={activity}
              checked={false}
              showCheckbox={false}
              onCheckedChange={() => {}}
            />
          ))}
        </div>
      )}
    </section>
  );
}
