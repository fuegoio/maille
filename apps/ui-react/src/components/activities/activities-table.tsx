import { ActivityType, type Activity } from "@maille/core/activities";
import { verifyActivityFilter } from "@maille/core/activities";
import { Calendar, ChevronDown } from "lucide-react";
import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { ScrollArea } from "@/components/ui/scroll-area";
import { getCurrencyFormatter } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { ActivityLine } from "./activity-line";
import { ActivitiesFilters } from "./filters/activities-filters";

// Activity type colors mapping
const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "red",
  [ActivityType.REVENUE]: "green",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "slate",
};

interface ActivitiesTableProps {
  viewId: string;
  activities: Activity[];
  grouping?: "period" | null;
  accountFilter?: string | null;
  categoryFilter?: string | null;
  subcategoryFilter?: string | null;
  activityTypeFilter?: ActivityType | null;
  hideProject?: boolean;
}

export function ActivitiesTable({
  viewId,
  activities,
  grouping = null,
  accountFilter = null,
  categoryFilter = null,
  subcategoryFilter = null,
  activityTypeFilter = null,
  hideProject = false,
}: ActivitiesTableProps) {
  const activityView = useViews((state) => state.getActivityView(viewId));
  const focusedActivity = useActivities((state) => state.focusedActivity);
  const filterStringBySearch = useSearch((state) => state.filterStringBySearch);
  const setFocusedActivity = useActivities((state) => state.setFocusedActivity);
  const currencyFormatter = getCurrencyFormatter();

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      setFocusedActivity(null);
    };
  }, []);

  const activitiesFiltered = React.useMemo(() => {
    return activities
      .filter((activity) => filterStringBySearch(activity.name))
      .filter((activity) => {
        if (subcategoryFilter !== null) {
          return activity.subcategory === subcategoryFilter;
        }

        if (categoryFilter !== null) {
          return activity.category === categoryFilter;
        }

        return true;
      })
      .filter((activity) => {
        if (accountFilter !== null) {
          return (
            activity.transactions.filter(
              (t) =>
                t.toAccount === accountFilter ||
                t.fromAccount === accountFilter,
            ).length > 0
          );
        } else {
          return true;
        }
      })
      .filter((activity) =>
        activityTypeFilter !== null
          ? activity.type === activityTypeFilter
          : true,
      )
      .filter((activity) => {
        if (activityView.filters.length === 0) return true;

        return activityView.filters
          .map((filter) => {
            return verifyActivityFilter(filter, activity);
          })
          .every((f) => f);
      });
  }, [
    activities,
    filterStringBySearch,
    subcategoryFilter,
    categoryFilter,
    accountFilter,
    activityTypeFilter,
    activityView.filters,
  ]);

  const activitiesSorted = React.useMemo(() => {
    return [...activitiesFiltered].sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [activitiesFiltered]);

  type Group = {
    id: string;
    month: number;
    year: number;
    total: {
      [ActivityType.EXPENSE]?: number;
      [ActivityType.REVENUE]?: number;
      [ActivityType.INVESTMENT]?: number;
    };
  };

  type ActivityAndGroup =
    | ({ itemType: "group" } & Group)
    | ({ itemType: "activity" } & Activity);

  const activitiesWithGroups = React.useMemo<ActivityAndGroup[]>(() => {
    if (!grouping)
      return activitiesSorted.map((a) => ({ itemType: "activity", ...a }));

    const groups = activitiesSorted.reduce(
      (groups: (Group & { activities: Activity[] })[], a) => {
        const month = a.date.getMonth();
        const year = a.date.getFullYear();
        let group = groups.find((p) => p.month === month && p.year === year);

        if (group) {
          group.activities.push(a);
        } else {
          group = {
            id: `${month}-${year}`,
            month,
            year,
            total: {},
            activities: [a],
          };
          groups.push(group);
        }

        if (a.type !== ActivityType.NEUTRAL) {
          const typeKey = a.type.toLowerCase() as keyof Group["total"];
          if (group.total[typeKey] === undefined) {
            group.total[typeKey] = a.amount;
          } else {
            group.total[typeKey]! += a.amount;
          }
        }

        return groups;
      },
      [],
    );

    return groups
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .reduce((awg: ActivityAndGroup[], group) => {
        awg.push({
          itemType: "group",
          id: group.id,
          month: group.month,
          year: group.year,
          total: group.total,
        });
        return awg.concat(
          group.activities.map((a) => ({ itemType: "activity", ...a })),
        );
      }, []);
  }, [activitiesSorted, grouping]);

  const periodFormatter = (month: number, year: number): string => {
    return new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  const handleActivityClick = (activityId: string) => {
    if (focusedActivity === activityId) {
      setFocusedActivity(null);
    } else {
      setFocusedActivity(activityId);
    }
  };

  // Hotkeys for navigation
  useHotkeys("k", () => {
    if (activitiesSorted.length === 0) return;

    const currentIndex = activitiesSorted.findIndex(
      (activity) => activity.id === focusedActivity,
    );

    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex - 1 + activitiesSorted.length) %
          activitiesSorted.length;

    setFocusedActivity(activitiesSorted[nextIndex].id);
  });

  useHotkeys("j", () => {
    if (activitiesSorted.length === 0) return;

    const currentIndex = activitiesSorted.findIndex(
      (activity) => activity.id === focusedActivity,
    );

    const nextIndex = (currentIndex + 1) % activitiesSorted.length;
    setFocusedActivity(activitiesSorted[nextIndex].id);
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ActivitiesFilters
        viewId={activityView.id}
        activities={activitiesFiltered}
      />

      <div className="flex h-full flex-1 overflow-x-hidden">
        <div className="flex w-full flex-col overflow-x-hidden sm:min-w-[575px]">
          {activitiesFiltered.length !== 0 ? (
            <ScrollArea className="flex-1 pb-40">
              {grouping
                ? activitiesWithGroups.map((item) => (
                    <React.Fragment key={item.id}>
                      {item.itemType === "group" ? (
                        <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted pl-6">
                          <ChevronDown className="mr-3 size-3 opacity-20 transition-opacity hover:opacity-100" />
                          <Calendar className="size-4" />
                          <div className="text-sm">
                            {periodFormatter(item.month, item.year)}
                          </div>
                          <div className="flex-1" />

                          {[
                            ActivityType.INVESTMENT,
                            ActivityType.REVENUE,
                            ActivityType.EXPENSE,
                          ].map((activityType) => {
                            const typeKey =
                              activityType.toLowerCase() as keyof Group["total"];
                            return item.total[typeKey] ? (
                              <div
                                key={activityType}
                                className="hidden items-center pl-4 text-right font-mono text-sm text-white sm:flex"
                              >
                                <div
                                  className="mt-0.5 mr-3 size-[9px] shrink-0 rounded-xs"
                                  style={{
                                    backgroundColor: `var(--${ACTIVITY_TYPES_COLOR[activityType]}-300)`,
                                  }}
                                />
                                {currencyFormatter.format(item.total[typeKey]!)}
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <ActivityLine
                          activity={item}
                          accountFilter={accountFilter}
                          hideProject={hideProject}
                          onClick={handleActivityClick}
                          selected={focusedActivity === item.id}
                        />
                      )}
                    </React.Fragment>
                  ))
                : activitiesSorted.map((activity) => (
                    <ActivityLine
                      key={activity.id}
                      activity={activity}
                      accountFilter={accountFilter}
                      hideProject={hideProject}
                      onClick={handleActivityClick}
                      selected={focusedActivity === activity.id}
                    />
                  ))}
            </ScrollArea>
          ) : (
            <div className="flex flex-1 items-center justify-center overflow-hidden">
              <div className="text-sm text-muted-foreground">
                No activity found.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
