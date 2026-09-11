import { ActivityType, type Activity } from "@maille/core/activities";
import { verifyActivityFilter } from "@maille/core/activities";
import * as React from "react";

import { useContextNavigate } from "@/components/navigation/breadcrumbs";
import { EntityContextMenu } from "@/components/shared/entity-actions";
import { TableGroupHeader } from "@/components/shared/table-group-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useGroupedRows } from "@/hooks/use-grouped-rows";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES_COLOR } from "@/stores/activities";
import { useSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { useActivitiesEntityActions } from "./activities-actions";
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
  const contextNavigate = useContextNavigate();
  const currencyFormatter = useCurrencyFormatter();

  const activityView = useViews((state) => state.getActivityView(viewId));
  const search = useSearch((state) => state.search);
  const scrollRef = useScrollRestoration<HTMLDivElement>(
    `activities:${viewId}`,
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

  const { items, isFolded, toggleGroup } = useGroupedRows(
    activitiesSorted,
    grouping !== null,
  );

  const rows = React.useMemo<TableRow[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        selectable: item.itemType === "row",
      })),
    [items],
  );

  const {
    rowOutlines,
    registerRow,
    selectedIds: selectedActivities,
    toggle: toggleActivity,
    selectOnly: selectOnlyActivity,
    clearSelection: clearSelectedActivities,
  } = useTableRows({
    rows,
    checkable: true,
    onOpen: (id) => {
      void contextNavigate({ to: "/activities/$id", params: { id } });
    },
  });

  const entityActions = useActivitiesEntityActions(
    selectedActivities,
    clearSelectedActivities,
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ActivitiesFilters
        viewId={activityView.id}
        activities={activitiesFiltered}
      />

      <div className="flex flex-1 flex-col overflow-y-auto">
        {activitiesFiltered.length !== 0 ? (
          <ScrollArea className="flex-1 pb-40" viewportRef={scrollRef}>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.itemType === "group" ? (
                  <TableGroupHeader
                    id={item.id}
                    folded={isFolded(item.id)}
                    onToggle={toggleGroup}
                    month={item.month}
                    year={item.year}
                  >
                    {[
                      ActivityType.INVESTMENT,
                      ActivityType.REVENUE,
                      ActivityType.EXPENSE,
                    ].map((activityType) => {
                      const total = item.rows
                        .filter((activity) => activity.type === activityType)
                        .reduce((sum, activity) => sum + activity.amount, 0);

                      return total !== 0 ? (
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
                          {currencyFormatter.format(total)}
                        </div>
                      ) : null;
                    })}
                  </TableGroupHeader>
                ) : (
                  <EntityContextMenu
                    actions={entityActions}
                    onActionComplete={clearSelectedActivities}
                  >
                    <div
                      ref={registerRow(item.id)}
                      onContextMenu={() => {
                        if (!selectedActivities.includes(item.id)) {
                          selectOnlyActivity(item.id);
                        }
                      }}
                    >
                      <ActivityLine
                        activity={item}
                        accountFilter={accountFilter}
                        hideProject={hideProject}
                        checked={selectedActivities.includes(item.id)}
                        outlineSides={rowOutlines.get(item.id)}
                        onCheckedChange={(event) =>
                          toggleActivity(item.id, event)
                        }
                      />
                    </div>
                  </EntityContextMenu>
                )}
              </React.Fragment>
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
        onClearSelection={clearSelectedActivities}
      />
    </div>
  );
}
