import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Calendar, CalendarCheck, CalendarClock } from "lucide-react";
import { useState } from "react";
import z from "zod";

import type { ActivitiesFilters } from "@/types/activities";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { ActivityViewSettingsButton } from "@/components/activities/activity-view-settings-button";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { MonthAccountsSummary } from "@/components/months/month-accounts-summary";
import { MonthActivitiesSummary } from "@/components/months/month-activities-summary";
import { MonthFundsSummary } from "@/components/months/month-funds-summary";
import { MonthSummary } from "@/components/months/month-summary";
import { ExportMovementsButton } from "@/components/movements/export-movements-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { MovementsTable } from "@/components/movements/movements-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { TableViewSettingsButton } from "@/components/shared/table-view-settings-button";
import { ViewActions } from "@/components/shared/view-actions";
import { ExportTransactionsButton } from "@/components/transactions/export-transactions-button";
import { FilterTransactionsButton } from "@/components/transactions/filters/filter-transactions-button";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import { ViewSelect } from "@/components/views/view-select";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ActivityIcon, MovementIcon, TransactionIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";

const searchParamsSchema = z.object({
  /** "activities", "movements", or a custom view's id. */
  view: z.string().optional(),
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
  const { view } = Route.useSearch();
  const selectedTab = view ?? "activities";

  const activities = useActivities((state) => state.activities);
  const movements = useMovements((state) => state.movements);

  const viewScope = { kind: "month", month, year } as const;
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const [activitiesFilters, setActivitiesFilters] = useState<ActivitiesFilters>(
    {},
  );

  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);

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

  const monthFormatter = (date: Date): string => {
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  // The month's phase against today, read like the months table's rows.
  // The loader's date may be any day of the month, so compare the month.
  const today = new Date();
  const monthPhase: "past" | "current" | "future" =
    monthDate.getFullYear() === today.getFullYear() &&
    monthDate.getMonth() === today.getMonth()
      ? "current"
      : new Date(monthDate.getFullYear(), monthDate.getMonth(), 1) > today
        ? "future"
        : "past";
  const monthPhaseIcon =
    monthPhase === "past" ? (
      <CalendarCheck className="size-4 text-muted-foreground" />
    ) : monthPhase === "current" ? (
      <Calendar className="size-4 text-primary" />
    ) : (
      <CalendarClock className="size-4 text-muted-foreground" />
    );

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/months/$month",
    entries: [
      { key: "months", label: "Months", target: { to: "/months" } },
      {
        key: `month:${month}`,
        label: (
          <span className="flex items-center gap-1.5">
            {monthPhaseIcon}
            {monthFormatter(monthDate)}
          </span>
        ),
        target: { to: "/months/$month", params: { month: monthParam } },
      },
    ],
  });

  return (
    <SidebarInset className="@container flex-row">
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          summaryOpen && "hidden @min-[45rem]:flex",
        )}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />

          <PageBreadcrumbs entries={breadcrumbs} />
          <div className="flex-1" />

          <SearchBar />
          <AddActivityButton variant="default" date={monthDate} hotkey />
        </header>

        <Tabs
          value={selectedTab}
          onValueChange={(value) =>
            navigate({
              to: ".",
              search: (prev) => ({
                ...prev,
                view: value,
              }),
            })
          }
          className="min-h-0 flex-1"
        >
          <header className="@container flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
            <ViewSelect
              className="sm:hidden"
              scope={viewScope}
              value={selectedTab}
              onSelect={(value) =>
                navigate({
                  to: ".",
                  search: (prev) => ({
                    ...prev,
                    view: value,
                  }),
                })
              }
              builtIn={[
                {
                  value: "activities",
                  label: "Activities",
                  icon: ActivityIcon,
                },
                {
                  value: "transactions",
                  label: "Transactions",
                  icon: TransactionIcon,
                },
                { value: "movements", label: "Movements", icon: MovementIcon },
              ]}
            />
            <TabsList
              height="full"
              className="hidden min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 sm:flex [&_[data-slot=tabs-trigger]]:after:bottom-0"
            >
              <TabsTrigger value="activities">
                <ActivityIcon />
                Activities
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <TransactionIcon />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="movements">
                <MovementIcon />
                Movements
              </TabsTrigger>
              <CustomViewTabs
                scope={viewScope}
                onSelect={(value) =>
                  navigate({
                    to: ".",
                    search: (prev) => ({ ...prev, view: value }),
                  })
                }
              />
            </TabsList>
            <div className="flex-1" />
            {selectedCustomView !== null && (
              <CustomViewActions
                view={selectedCustomView}
                onConfigChange={(config) =>
                  updateViewConfig(selectedCustomView, config)
                }
                onDeleted={() =>
                  navigate({
                    to: ".",
                    search: (prev) => ({ ...prev, view: "activities" }),
                  })
                }
              />
            )}
            {selectedCustomView === null && selectedTab === "activities" && (
              <>
                <ViewActions>
                  <FilterActivitiesButton
                    viewId={`month-${month}-${year}-activities`}
                  />
                  <ActivityViewSettingsButton
                    viewId={`month-${month}-${year}-activities`}
                  />
                  <ExportActivitiesButton
                    viewId={`month-${month}-${year}-activities`}
                    activities={monthActivities}
                  />
                </ViewActions>
              </>
            )}
            {selectedCustomView === null && selectedTab === "transactions" && (
              <>
                <ViewActions>
                  <FilterTransactionsButton
                    viewId={`month-${month}-${year}-transactions`}
                  />
                  <TableViewSettingsButton
                    kind="transaction"
                    viewId={`month-${month}-${year}-transactions`}
                  />
                  <ExportTransactionsButton
                    filter={{ kind: "month", month, year }}
                    viewId={`month-${month}-${year}-transactions`}
                  />
                </ViewActions>
              </>
            )}
            {selectedCustomView === null && selectedTab === "movements" && (
              <>
                <ViewActions>
                  <FilterMovementsButton
                    viewId={`month-${month}-${year}-movements`}
                  />
                  <TableViewSettingsButton
                    kind="movement"
                    viewId={`month-${month}-${year}-movements`}
                  />
                  <ExportMovementsButton
                    viewId={`month-${month}-${year}-movements`}
                    movements={monthMovements}
                  />
                </ViewActions>
              </>
            )}
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
              // The page already names the month, so row dates stay short
              fullDate={false}
            />
          </TabsContent>

          <TabsContent value="transactions" className="flex h-full">
            <TransactionsTable
              filter={{ kind: "month", month, year }}
              viewId={`month-${month}-${year}-transactions`}
            />
          </TabsContent>

          <TabsContent value="movements" className="flex h-full">
            <MovementsTable
              viewId={`month-${month}-${year}-movements`}
              movements={monthMovements}
              accountFilter={activitiesFilters.account ?? null}
            />
          </TabsContent>

          <CustomViewTabsContent scope={viewScope} />
        </Tabs>
      </div>

      <SummaryPanel
        open={summaryOpen}
        onOpen={() => setSummaryOpen(true)}
        onClose={() => setSummaryOpen(false)}
      >
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
              onActivitiesFiltersChange={setActivitiesFilters}
              monthDate={monthDate}
            />
          </TabsContent>

          <TabsContent value="accounts">
            <MonthAccountsSummary
              monthDate={monthDate}
              accountFilter={activitiesFilters.account}
              onAccountFilterChange={(account) =>
                setActivitiesFilters((prev) => ({ ...prev, account }))
              }
            />
          </TabsContent>

          <TabsContent value="funds">
            <MonthFundsSummary
              monthDate={monthDate}
              fundFilter={activitiesFilters.fund}
              onFundFilterChange={(fund) =>
                setActivitiesFilters((prev) => ({ ...prev, fund }))
              }
            />
          </TabsContent>
        </Tabs>
      </SummaryPanel>
    </SidebarInset>
  );
}
