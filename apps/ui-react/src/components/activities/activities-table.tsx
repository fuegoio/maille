import { ActivityType, type Activity } from "@maille/core/activities";
import { verifyActivityFilter } from "@maille/core/activities";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Calendar, ChevronDown } from "lucide-react";
import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES_COLOR, useActivities } from "@/stores/activities";
import { useSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { ActivityLine } from "./activity-line";
import { ActivitiesFilters } from "./filters/activities-filters";

interface ActivitiesTableProps {
  viewId: string;
  activities: Activity[];
  grouping?: "period" | null;
  accountFilter?: string | null;
  categoryFilter?: string | null;
  subcategoryFilter?: string | null;
  activityTypeFilter?: ActivityType | null;
  hideProject?: boolean;
  defaultActivityFocused?: string;
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
  defaultActivityFocused,
}: ActivitiesTableProps) {
  const currencyFormatter = useCurrencyFormatter();

  const activityView = useViews((state) => state.getActivityView(viewId));
  const focusedActivity = useActivities((state) => state.focusedActivity);
  const search = useSearch((state) => state.search);
  const setFocusedActivity = useActivities((state) => state.setFocusedActivity);

  const [selectedActivities, setSelectedActivities] = React.useState<string[]>(
    [],
  );
  const [groupsFolded, setGroupsFolded] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (defaultActivityFocused) {
      setFocusedActivity(defaultActivityFocused);
    }

    return () => {
      if (!defaultActivityFocused) {
        setFocusedActivity(null);
      }
    };
  }, [setFocusedActivity, defaultActivityFocused]);

  const activitiesFiltered = React.useMemo(() => {
    return activities
      .filter((activity) => searchCompare(search, activity.name))
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
    search,
    subcategoryFilter,
    categoryFilter,
    accountFilter,
    activityTypeFilter,
    activityView,
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
        if (!groupsFolded.includes(group.id)) {
          return awg.concat(
            group.activities.map((a) => ({ itemType: "activity", ...a })),
          );
        } else {
          return awg;
        }
      }, []);
  }, [activitiesSorted, grouping, groupsFolded]);

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
  useHotkey("K", (event) => {
    if (event.key !== "k") return;
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

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    if (activitiesSorted.length === 0) return;

    const currentIndex = activitiesSorted.findIndex(
      (activity) => activity.id === focusedActivity,
    );

    const nextIndex = (currentIndex + 1) % activitiesSorted.length;
    setFocusedActivity(activitiesSorted[nextIndex].id);
  });

  useHotkey("Space", () => {
    if (focusedActivity === null) return;
    const activity = activitiesSorted.find(
      (activity) => activity.id === focusedActivity,
    );
    if (activity === undefined) return;

    if (selectedActivities.includes(activity.id)) {
      setSelectedActivities((prev) => prev.filter((id) => id !== activity.id));
    } else {
      setSelectedActivities((prev) => [...prev, activity.id]);
    }
  });

  useHotkey(
    "Escape",
    () => {
      if (selectedActivities.length > 0) {
        setSelectedActivities([]);
      }
    },
    {
      conflictBehavior: "allow",
    },
  );

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
                        <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 px-5 sm:px-6">
                          <ChevronDown
                            className={cn(
                              "mr-3 size-3 opacity-20 transition-all hover:opacity-100",
                              groupsFolded.includes(item.id) &&
                                "-rotate-90 opacity-100",
                            )}
                            onClick={() => {
                              if (groupsFolded.includes(item.id)) {
                                setGroupsFolded((prev) =>
                                  prev.filter((id) => id !== item.id),
                                );
                              } else {
                                setGroupsFolded((prev) => [...prev, item.id]);
                              }
                            }}
                          />
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
                                className="hidden items-center pl-4 text-right font-mono text-sm sm:flex"
                              >
                                <div
                                  className={cn(
                                    "mr-3 size-2.5 shrink-0 rounded-lg",
                                    ACTIVITY_TYPES_COLOR[activityType],
                                  )}
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
                          checked={selectedActivities.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedActivities((prev) => [
                                ...prev,
                                item.id,
                              ]);
                            } else {
                              setSelectedActivities((prev) =>
                                prev.filter((id) => id !== item.id),
                              );
                            }
                          }}
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
                      checked={selectedActivities.includes(activity.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedActivities((prev) => [
                            ...prev,
                            activity.id,
                          ]);
                        } else {
                          setSelectedActivities((prev) =>
                            prev.filter((id) => id !== activity.id),
                          );
                        }
                      }}
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
