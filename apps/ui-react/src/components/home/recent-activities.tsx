import type { Activity } from "@maille/core/activities";

import { Link } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { format } from "date-fns";
import { CircleCheck, CircleDashed, CircleDotDashed } from "lucide-react";
import { useMemo } from "react";

import { ActivityAmountsValue } from "@/components/activities/activity-amounts";
import { ContextLink } from "@/components/navigation/breadcrumbs";
import {
  ledgerHeaderClassName,
  ledgerRowClassName,
} from "@/components/shared/ledger-table";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

const RECENT_COUNT = 8;

const StatusIcon = ({ status }: { status: Activity["status"] }) => {
  if (status === "scheduled") {
    return <CircleDashed className="size-4 shrink-0 text-muted-foreground" />;
  }
  if (status === "incomplete") {
    return <CircleDotDashed className="size-4 shrink-0 text-warning" />;
  }
  return <CircleCheck className="size-4 shrink-0 text-primary" />;
};

/**
 * The latest ledger entries: the most recent activities with their status
 * marks and per-type amounts, in the shared table vocabulary.
 */
export function RecentActivities() {
  const activities = useActivities((state) => state.activities);
  const categories = useActivities((state) => state.activityCategories);

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
          {recent.map((activity) => {
            const category = categories.find(
              (candidate) => candidate.id === activity.category,
            );

            return (
              <ContextLink
                key={activity.id}
                to="/activities/$id"
                params={{ id: activity.id }}
                aria-label={activity.name}
                className={cn(
                  ledgerRowClassName,
                  "flex h-10 shrink-0 items-center gap-2 border-b pr-2 pl-4 text-sm last:border-b-0 lg:px-6",
                )}
              >
                <div className="w-12 shrink-0 text-muted-foreground">
                  {format(activity.date, "dd EEE")}
                </div>

                <StatusIcon status={activity.status} />

                <div className="min-w-0 truncate text-foreground">
                  {activity.name}
                </div>

                {category && (
                  <div className="hidden min-w-0 truncate text-muted-foreground sm:block">
                    · {category.emoji} {category.name}
                  </div>
                )}

                <div className="flex-1" />

                <ActivityAmountsValue
                  amounts={activity.amounts}
                  className="text-sm"
                />
              </ContextLink>
            );
          })}
        </div>
      )}
    </section>
  );
}
