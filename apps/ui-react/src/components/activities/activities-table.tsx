import { ActivityType, type Activity } from "@maille/core/activities";
import { verifyActivityFilter } from "@maille/core/activities";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import { Calendar, ChevronDown } from "lucide-react";
import * as React from "react";

import { BulkActionsContextMenu } from "@/components/shared/bulk-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES_COLOR } from "@/stores/activities";
import { useSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { useActivitiesBulkActions } from "./activities-bulk-actions";
import { ActivitiesSelection } from "./activities-selection";
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
  const router = useRouter();
  const currencyFormatter = useCurrencyFormatter();

  const activityView = useViews((state) => state.getActivityView(viewId));
  const search = useSearch((state) => state.search);
  const scrollRef = useScrollRestoration<HTMLDivElement>(
    `activities:${viewId}`,
  );

  const [selectedActivities, setSelectedActivities] = React.useState<string[]>(
    [],
  );
  const [groupsFolded, setGroupsFolded] = React.useState<string[]>([]);

  const bulkActions = useActivitiesBulkActions(selectedActivities, () =>
    setSelectedActivities([]),
  );

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

  // Hotkeys: open the first activity of the list, then continue with J/K on
  // the activity page
  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    if (activitiesSorted.length === 0) return;

    void router.navigate({
      to: "/activities/$id",
      params: { id: activitiesSorted[0].id },
      replace: true,
    });
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    if (activitiesSorted.length === 0) return;

    void router.navigate({
      to: "/activities/$id",
      params: { id: activitiesSorted[0].id },
      replace: true,
    });
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

  useHotkey(
    "Mod+A",
    (event) => {
      if (event.key !== "a") return;
      setSelectedActivities(activitiesFiltered.map((a) => a.id));
    },
    {
      ignoreInputs: true,
    },
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ActivitiesFilters
        viewId={activityView.id}
        activities={activitiesFiltered}
      />

      <div className="flex h-full flex-1 flex-col overflow-y-auto">
        {activitiesFiltered.length !== 0 ? (
          <ScrollArea className="flex-1 pb-40" viewportRef={scrollRef}>
            {grouping
              ? activitiesWithGroups.map((item) => (
                  <React.Fragment key={item.id}>
                    {item.itemType === "group" ? (
                      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 pr-2 pl-5 sm:px-6">
                        <ChevronDown
                          className={cn(
                            "mr-1 size-3 opacity-20 transition-all hover:opacity-100 sm:mr-3",
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
                        <Calendar className="hidden size-4 sm:block" />
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
                              className="flex items-center pl-1 text-right font-mono text-sm sm:pl-4"
                            >
                              <div
                                className={cn(
                                  "mr-2 size-2.5 shrink-0 rounded-lg sm:mr-3",
                                  ACTIVITY_TYPES_COLOR[activityType],
                                )}
                              />
                              {currencyFormatter.format(item.total[typeKey]!)}
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <BulkActionsContextMenu
                        actions={bulkActions}
                        onActionComplete={() => setSelectedActivities([])}
                      >
                        <div
                          onContextMenu={() => {
                            if (!selectedActivities.includes(item.id)) {
                              setSelectedActivities([item.id]);
                            }
                          }}
                        >
                          <ActivityLine
                            activity={item}
                            accountFilter={accountFilter}
                            hideProject={hideProject}
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
                        </div>
                      </BulkActionsContextMenu>
                    )}
                  </React.Fragment>
                ))
              : activitiesSorted.map((activity) => (
                  <BulkActionsContextMenu
                    key={activity.id}
                    actions={bulkActions}
                    onActionComplete={() => setSelectedActivities([])}
                  >
                    <div
                      onContextMenu={() => {
                        if (!selectedActivities.includes(activity.id)) {
                          setSelectedActivities([activity.id]);
                        }
                      }}
                    >
                      <ActivityLine
                        activity={activity}
                        accountFilter={accountFilter}
                        hideProject={hideProject}
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
                    </div>
                  </BulkActionsContextMenu>
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

      <ActivitiesSelection
        selectedActivities={selectedActivities}
        onClearSelection={() => setSelectedActivities([])}
      />
    </div>
  );
}
