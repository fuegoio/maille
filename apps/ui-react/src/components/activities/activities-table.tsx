import type { ViewConfig as CustomViewConfig } from "@maille/core/views";

import {
  ActivityType,
  sumActivityAmounts,
  verifyActivityFilter,
  type Activity,
} from "@maille/core/activities";
import * as React from "react";

import { useContextNavigate } from "@/components/navigation/breadcrumbs";
import { EntityContextMenu } from "@/components/shared/entity-actions";
import { TableGroupHeader } from "@/components/shared/table-group-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupedRows } from "@/hooks/use-grouped-rows";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { searchCompare } from "@/lib/strings";
import { viewGroupOrder } from "@/lib/view-grouping";
import { sortViewRows } from "@/lib/view-ordering";
import { activityTouchesFund } from "@/logic/funds";
import { useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { useActivitiesEntityActions } from "./activities-actions";
import { ActivitiesSelection } from "./activities-selection";
import { ActivityAmountsValue } from "./activity-amounts";
import { ActivityLine } from "./activity-line";
import {
  ACTIVITY_VIEW_FIELDS,
  ACTIVITY_VIEW_GROUPINGS,
  activityGroupAccessors,
  visibleActivityAmountTypes,
  activityOrderingAccessors,
  type ActivityViewGrouping,
} from "./activity-view";
import { ActivitiesFilters } from "./filters/activities-filters";

interface ActivitiesTableProps {
  viewId: string;
  activities: Activity[];
  /**
   * A custom view's config; overrides the store-backed view. Pass
   * onConfigChange to make the view's filter bar editable.
   */
  config?: Extract<CustomViewConfig, { resource: "activities" }>;
  onConfigChange?: (
    config: Extract<CustomViewConfig, { resource: "activities" }>,
  ) => void;
  /** Grouping modes the page allows; the view's choice wins when allowed. */
  groupings?: readonly ActivityViewGrouping[];
  accountFilter?: string | null;
  categoryFilter?: string | null;
  subcategoryFilter?: string | null;
  activityTypeFilter?: ActivityType | null;
  /** A fund the activities must touch; null is Untracked, undefined is off. */
  fundFilter?: string | null;
  hideProject?: boolean;
}

export function ActivitiesTable({
  viewId,
  activities,
  config,
  onConfigChange,
  groupings = ACTIVITY_VIEW_GROUPINGS,
  accountFilter = null,
  categoryFilter = null,
  subcategoryFilter = null,
  activityTypeFilter = null,
  fundFilter,
  hideProject = false,
}: ActivitiesTableProps) {
  const contextNavigate = useContextNavigate();

  const storedView = useViews((state) => state.getActivityView(viewId));
  const activityView = config ?? storedView;
  const { search } = useViewSearch();
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const projects = useProjects((state) => state.projects);
  const groupAccessors = React.useMemo(
    () => activityGroupAccessors(categories, subcategories, projects),
    [categories, subcategories, projects],
  );
  const scrollRef = useScrollRestoration<HTMLDivElement>(
    `activities:${viewId}`,
  );

  // The view's grouping applies when the page allows it; otherwise the
  // page's first allowed mode wins.
  const grouping: ActivityViewGrouping = groupings.includes(
    activityView.grouping as ActivityViewGrouping,
  )
    ? (activityView.grouping as ActivityViewGrouping)
    : groupings[0];

  const fields = React.useMemo(
    () =>
      ACTIVITY_VIEW_FIELDS.filter(
        (field) =>
          activityView.fields.includes(field) &&
          (field !== "project" || !hideProject),
      ),
    [activityView.fields, hideProject],
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
          ? activity.types.includes(activityTypeFilter)
          : true,
      )
      .filter((activity) =>
        fundFilter === undefined
          ? true
          : activityTouchesFund(activity, fundFilter),
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
    fundFilter,
    activityView,
  ]);

  const activitiesSorted = React.useMemo(() => {
    return sortViewRows(
      activitiesFiltered,
      activityView.ordering,
      activityOrderingAccessors,
    );
  }, [activitiesFiltered, activityView.ordering]);

  const { items, isFolded, toggleGroup } = useGroupedRows(
    activitiesSorted,
    grouping,
    groupAccessors,
    viewGroupOrder(grouping, activityView.ordering),
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
        viewId={config === undefined ? viewId : undefined}
        activities={activitiesFiltered}
        filters={config?.filters}
        fields={config?.fields}
        onFiltersChange={
          config !== undefined && onConfigChange !== undefined
            ? (filters) => onConfigChange({ ...config, filters })
            : undefined
        }
      />

      <div className="flex flex-1 flex-col overflow-y-auto">
        {activitiesFiltered.length !== 0 ? (
          <ScrollArea className="flex-1" viewportRef={scrollRef}>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.itemType === "group" ? (
                  <TableGroupHeader
                    id={item.id}
                    folded={isFolded(item.id)}
                    onToggle={toggleGroup}
                    label={item.label}
                    shortLabel={item.shortLabel}
                    calendar={item.calendar}
                    marker={item.marker}
                    parent={item.parent}
                    count={item.rows.length}
                  >
                    <ActivityAmountsValue
                      amounts={sumActivityAmounts(item.rows)}
                      types={visibleActivityAmountTypes(fields)}
                      className="text-sm"
                    />
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
                        fields={fields}
                        fullDate={grouping !== "period"}
                        showTransactions={activityView.showTransactions}
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
