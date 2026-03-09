import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BookMarked,
  ArrowRightLeft,
  SquareChartGantt,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { ActivitiesFilters } from "@/types/activities";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { MonthAccountsSummary } from "@/components/months/month-accounts-summary";
import { MonthActivitiesSummary } from "@/components/months/month-activities-summary";
import { MonthSummary } from "@/components/months/month-summary";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { Movement } from "@/components/movements/movement";
import { MovementsTable } from "@/components/movements/movements-table";
import { SearchBar } from "@/components/search-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";

export const Route = createFileRoute("/_authenticated/months/$month")({
  component: MonthPage,
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
  const [selectedTab, setSelectedTab] = useState("activities");

  const activities = useActivities((state) => state.activities);
  const focusedActivity = useActivities((state) => state.focusedActivity);
  const movements = useMovements((state) => state.movements);
  const focusedMovement = useMovements((state) => state.focusedMovement);

  const [activitiesFilters, setActivitiesFilters] = useState<ActivitiesFilters>(
    {},
  );

  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);

  useEffect(() => {
    if (focusedActivity || focusedMovement) {
      setSummaryOpen(false);
    }
  }, [focusedActivity, focusedMovement, setSummaryOpen]);

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

  return (
    <>
      <SidebarInset className="flex-row">
        <div className={cn("min-w-0 flex-1", summaryOpen && "hidden md:block")}>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
            <SidebarTrigger className="mr-1" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/months">Months</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{monthFormatter(monthDate)}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex-1" />

            <SearchBar />
            {!summaryOpen && (
              <Button
                variant="default"
                onClick={() => setSummaryOpen(true)}
                size={focusedActivity || focusedMovement ? "icon" : "default"}
              >
                <SquareChartGantt />
                {!(focusedActivity || focusedMovement) && (
                  <>
                    Summary
                    <ChevronRight />
                  </>
                )}
              </Button>
            )}
          </header>

          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="h-full"
          >
            <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 pr-4 pl-7">
              <TabsList className="ml-5">
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
            </header>

            <TabsContent value="activities" className="flex h-full">
              <ActivitiesTable
                viewId={`month-${month}-${year}-activities`}
                activities={monthActivities}
                activityTypeFilter={activitiesFilters.activityType}
                categoryFilter={activitiesFilters.category}
                subcategoryFilter={activitiesFilters.subcategory}
              />
            </TabsContent>

            <TabsContent value="movements" className="flex h-full">
              <MovementsTable
                viewId={`month-${month}-${year}-movements`}
                movements={monthMovements}
              />
            </TabsContent>
          </Tabs>
        </div>

        <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
          <MonthSummary monthDate={monthDate} />

          <Tabs className="h-full" defaultValue="activities">
            <TabsList className="h-12! w-full shrink-0 border-b bg-muted/50 px-4 py-2">
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
            </TabsList>

            <TabsContent value="activities">
              <MonthActivitiesSummary
                activitiesFilters={activitiesFilters}
                onActivitiesFiltersChange={setActivitiesFilters}
                monthDate={monthDate}
              />
            </TabsContent>

            <TabsContent value="accounts">
              <MonthAccountsSummary monthDate={monthDate} />
            </TabsContent>
          </Tabs>
        </SummaryPanel>
      </SidebarInset>

      {selectedTab === "activities" && <Activity />}
      {selectedTab === "movements" && <Movement />}
    </>
  );
}
