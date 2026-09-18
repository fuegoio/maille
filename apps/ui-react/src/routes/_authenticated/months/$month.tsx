import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { BookMarked, ArrowRightLeft } from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

import type { ActivitiesFilters } from "@/types/activities";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { ActivitiesFilterPanel } from "@/components/activities/filters/activities-filter-panel";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { ActivitiesAnalytics } from "@/components/analytics/activities-analytics";
import { MovementsAnalytics } from "@/components/analytics/movements-analytics";
import { MonthAccountsSummary } from "@/components/months/month-accounts-summary";
import { MonthActivitiesSummary } from "@/components/months/month-activities-summary";
import { MonthFundsSummary } from "@/components/months/month-funds-summary";
import { MonthSummary } from "@/components/months/month-summary";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { MovementsFilterPanel } from "@/components/movements/filters/movements-filter-panel";
import { MovementsTable } from "@/components/movements/movements-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { ViewSettingRow } from "@/components/shared/view-setting-row";
import {
  SIDE_PANEL_ICONS,
  SIDE_PANEL_LABELS,
  SidePanelToggles,
} from "@/components/ui/panel-toggles";
import { SidePanel } from "@/components/ui/side-panel";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { applyActivitiesFilters } from "@/logic/activities";
import { applyMovementsFilters } from "@/logic/movements";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";
import { usePanels, type SidePanelKind } from "@/stores/panels";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

const searchParamsSchema = z.object({
  tab: z.enum(["activities", "movements"]).optional(),
});

export const Route = createFileRoute("/_authenticated/months/$month")({
  component: MonthPage,
  validateSearch: searchParamsSchema,
  loader: async ({ params }) => {
    if (params.month === "current") {
      const now = new Date();
      return {
        monthDate: now,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };
    } else if (params.month === "past") {
      const now = new Date();
      now.setMonth(now.getMonth() - 1);
      return {
        monthDate: now,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };
    }

    const [month, year] = params.month.split("-").map(Number);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      throw notFound();
    }

    const monthDate = new Date(year, month - 1, 1);

    return { monthDate, month, year };
  },
});

function MonthPage() {
  const { month, year, monthDate } = Route.useLoaderData();
  const { month: monthParam } = Route.useParams();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const selectedTab = tab ?? "activities";

  const activities = useActivities((state) => state.activities);
  const movements = useMovements((state) => state.movements);
  const showTransactions = useActivities((state) => state.showTransactions);
  const setShowTransactions = useActivities(
    (state) => state.setShowTransactions,
  );

  const [activitiesFilters, setActivitiesFilters] = useState<ActivitiesFilters>(
    {},
  );

  const isMobile = useIsMobile();
  // The drawer is scoped to the tab: each tab's panels live under its own
  // view id, the same one its filters use.
  const viewId = `month-${month}-${year}-${selectedTab}`;
  const defaultPanel = isMobile ? null : "summary";
  const panelState = usePanels((state) => state.getPanel(viewId, defaultPanel));
  const closePanel = usePanels((state) => state.closePanel);
  const setFullView = usePanels((state) => state.setFullView);

  const { search } = useViewSearch();
  const activityView = useViews((state) =>
    state.getActivityView(`month-${month}-${year}-activities`),
  );
  const movementView = useViews((state) =>
    state.getMovementView(`month-${month}-${year}-movements`),
  );

  // Filter activities for this month
  const monthActivities = activities.filter((activity) => {
    return (
      activity.date.getFullYear() === monthDate.getFullYear() &&
      activity.date.getMonth() === monthDate.getMonth()
    );
  });

  // Filter movements for this month
  const monthMovements = movements.filter((movement) => {
    return (
      movement.date.getFullYear() === monthDate.getFullYear() &&
      movement.date.getMonth() === monthDate.getMonth()
    );
  });

  // The analytics panel describes exactly what the table shows: the
  // same set, the same filters.
  const filteredActivities = useMemo(
    () =>
      applyActivitiesFilters(monthActivities, {
        search,
        viewFilters: activityView.filters,
        accountFilter: activitiesFilters.account ?? null,
        categoryFilter: activitiesFilters.category ?? null,
        subcategoryFilter: activitiesFilters.subcategory ?? null,
        activityTypeFilter: activitiesFilters.activityType ?? null,
        fundFilter: activitiesFilters.fund,
      }),
    [
      monthActivities,
      search,
      activityView,
      activitiesFilters.account,
      activitiesFilters.category,
      activitiesFilters.subcategory,
      activitiesFilters.activityType,
      activitiesFilters.fund,
    ],
  );

  const filteredMovements = useMemo(
    () =>
      applyMovementsFilters(monthMovements, {
        search,
        viewFilters: movementView.filters,
        accountFilter: activitiesFilters.account ?? null,
      }),
    [monthMovements, search, movementView, activitiesFilters.account],
  );

  const monthFormatter = (date: Date): string => {
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/months/$month",
    entries: [
      { key: "months", label: "Months", target: { to: "/months" } },
      {
        key: `month:${month}`,
        label: monthFormatter(monthDate),
        target: { to: "/months/$month", params: { month: monthParam } },
      },
    ],
  });

  const panelOpen = panelState.panel !== null;
  // The panel sits beside the content on desktop, overlays it on mobile,
  // and replaces it entirely in full view.
  const mainHidden = panelOpen && (isMobile || panelState.fullView);

  const clusterPanels: SidePanelKind[] =
    selectedTab === "activities"
      ? ["filter", "settings", "analytics", "summary"]
      : ["filter", "analytics", "summary"];

  const panelTitle = panelState.panel
    ? SIDE_PANEL_LABELS[panelState.panel]
    : "Panel";
  const PanelIcon = panelState.panel
    ? SIDE_PANEL_ICONS[panelState.panel]
    : undefined;

  return (
    <SidebarInset className="flex-row">
      <div
        className={cn("flex min-w-0 flex-1 flex-col", mainHidden && "hidden")}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />

          <PageBreadcrumbs entries={breadcrumbs} />
          <div className="flex-1" />

          <SearchBar />
        </header>

        <Tabs
          value={selectedTab}
          onValueChange={(value) =>
            navigate({
              to: ".",
              search: (prev) => ({
                ...prev,
                tab: value as "activities" | "movements",
              }),
            })
          }
          className="min-h-0 flex-1"
        >
          <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 pr-4 pl-7">
            <TabsList height="full" className="ml-5">
              <TabsTrigger value="activities">
                <BookMarked />
                Activities
              </TabsTrigger>
              <TabsTrigger value="movements">
                <ArrowRightLeft />
                Movements
              </TabsTrigger>
            </TabsList>
            <div className="flex-1" />
            {selectedTab === "activities" && (
              <>
                <FilterActivitiesButton
                  viewId={`month-${month}-${year}-activities`}
                />
                <AddActivityButton size="sm" />
              </>
            )}
            {selectedTab === "movements" && (
              <FilterMovementsButton
                viewId={`month-${month}-${year}-movements`}
              />
            )}
            <SidePanelToggles
              viewId={viewId}
              panels={clusterPanels}
              defaultPanel={defaultPanel}
            />
          </header>

          <TabsContent value="activities" className="flex h-full">
            <ActivitiesTable
              viewId={`month-${month}-${year}-activities`}
              activities={monthActivities}
              activityTypeFilter={activitiesFilters.activityType}
              categoryFilter={activitiesFilters.category}
              subcategoryFilter={activitiesFilters.subcategory}
              accountFilter={activitiesFilters.account ?? null}
              fundFilter={activitiesFilters.fund}
            />
          </TabsContent>

          <TabsContent value="movements" className="flex h-full">
            <MovementsTable
              viewId={`month-${month}-${year}-movements`}
              movements={monthMovements}
              accountFilter={activitiesFilters.account ?? null}
            />
          </TabsContent>
        </Tabs>
      </div>

      {panelOpen && (
        <SidePanel
          title={panelTitle}
          icon={PanelIcon}
          onClose={() => closePanel(viewId)}
          fullView={panelState.fullView && panelState.panel === "analytics"}
          onToggleFullView={
            panelState.panel === "analytics"
              ? () => setFullView(viewId, !panelState.fullView)
              : undefined
          }
          scrollable={panelState.panel !== "analytics"}
        >
          {panelState.panel === "summary" &&
            (selectedTab === "activities" ? (
              <MonthSummaryPanel
                monthDate={monthDate}
                activitiesFilters={activitiesFilters}
                onActivitiesFiltersChange={setActivitiesFilters}
              />
            ) : (
              <>
                <MonthSummary monthDate={monthDate} />
                <MonthAccountsSummary
                  monthDate={monthDate}
                  accountFilter={activitiesFilters.account}
                  onAccountFilterChange={(account) =>
                    setActivitiesFilters((prev) => ({ ...prev, account }))
                  }
                />
              </>
            ))}

          {panelState.panel === "analytics" &&
            (selectedTab === "activities" ? (
              <ActivitiesAnalytics
                activities={filteredActivities}
                viewId="months-activities"
                defaults={{
                  y: "net",
                  x: "day",
                  groupBy: "type",
                  chart: "bar",
                }}
                fullView={panelState.fullView}
              />
            ) : (
              <MovementsAnalytics
                movements={filteredMovements}
                viewId="months-movements"
                defaults={{
                  y: "net",
                  x: "day",
                  groupBy: "none",
                  chart: "bar",
                }}
                fullView={panelState.fullView}
              />
            ))}

          {panelState.panel === "filter" &&
            (selectedTab === "activities" ? (
              <ActivitiesFilterPanel
                viewId={`month-${month}-${year}-activities`}
              />
            ) : (
              <MovementsFilterPanel
                viewId={`month-${month}-${year}-movements`}
              />
            ))}

          {panelState.panel === "settings" && (
            <div className="py-2">
              <ViewSettingRow
                label="Show transactions"
                description="Expand each activity's transactions in the table."
                checked={showTransactions}
                onCheckedChange={setShowTransactions}
              />
            </div>
          )}
        </SidePanel>
      )}
    </SidebarInset>
  );
}

/** The activities tab's summary: the month's totals, then the
 * activities, accounts and funds breakdowns. */
function MonthSummaryPanel({
  monthDate,
  activitiesFilters,
  onActivitiesFiltersChange,
}: {
  monthDate: Date;
  activitiesFilters: ActivitiesFilters;
  onActivitiesFiltersChange(filters: ActivitiesFilters): void;
}) {
  return (
    <>
      <MonthSummary monthDate={monthDate} />

      <Tabs className="h-full" defaultValue="activities">
        <TabsList
          height="lg"
          className="w-full shrink-0 border-b bg-muted/50 px-4"
        >
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="funds">Funds</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <MonthActivitiesSummary
            activitiesFilters={activitiesFilters}
            onActivitiesFiltersChange={onActivitiesFiltersChange}
            monthDate={monthDate}
          />
        </TabsContent>

        <TabsContent value="accounts">
          <MonthAccountsSummary
            monthDate={monthDate}
            accountFilter={activitiesFilters.account}
            onAccountFilterChange={(account) =>
              onActivitiesFiltersChange({
                ...activitiesFilters,
                account,
              })
            }
          />
        </TabsContent>

        <TabsContent value="funds">
          <MonthFundsSummary
            monthDate={monthDate}
            fundFilter={activitiesFilters.fund}
            onFundFilterChange={(fund) =>
              onActivitiesFiltersChange({
                ...activitiesFilters,
                fund,
              })
            }
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
