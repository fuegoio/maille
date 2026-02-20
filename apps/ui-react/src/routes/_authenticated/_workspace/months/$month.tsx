import { ActivityType } from "@maille/core/activities";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BookMarked,
  LayoutDashboard,
  ArrowRightLeft,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
import { Movement } from "@/components/movements/movement";
import { MovementsTable } from "@/components/movements/movements-table";
import { PeriodActivitiesSummary } from "@/components/periods/period-activities-summary";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrencyFormatter } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";

export const Route = createFileRoute(
  "/_authenticated/_workspace/months/$month",
)({
  component: MonthPage,
  loader: async ({ params }) => {
    if (params.month === "current") {
      const now = new Date();
      return {
        periodDate: now,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };
    } else if (params.month === "past") {
      const now = new Date();
      now.setMonth(now.getMonth() - 1);
      return {
        periodDate: now,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };
    }

    const [month, year] = params.month.split("-").map(Number);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      throw notFound();
    }

    const periodDate = new Date(year, month - 1, 1);

    return { periodDate, month, year };
  },
});

function MonthPage() {
  const { month, year, periodDate } = Route.useLoaderData();
  const [selectedTab, setSelectedTab] = useState("activities");

  const activities = useActivities((state) => state.activities);
  const movements = useMovements((state) => state.movements);

  // Filter activities for this month
  const monthActivities = activities.filter((activity) => {
    return (
      activity.date.getFullYear() === periodDate.getFullYear() &&
      activity.date.getMonth() === periodDate.getMonth()
    );
  });

  // Filter movements for this month
  const monthMovements = movements.filter((movement) => {
    return (
      movement.date.getFullYear() === periodDate.getFullYear() &&
      movement.date.getMonth() === periodDate.getMonth()
    );
  });

  const periodFormatter = (date: Date): string => {
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <SidebarInset>
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
                <BreadcrumbPage>{periodFormatter(periodDate)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
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
          </header>

          <TabsContent value="activities" className="flex h-full">
            <ActivitiesTable
              viewId={`month-${month}-${year}-activities`}
              activities={monthActivities}
            />
          </TabsContent>

          <TabsContent value="movements" className="flex h-full">
            <MovementsTable
              viewId={`month-${month}-${year}-movements`}
              movements={monthMovements}
            />
          </TabsContent>
        </Tabs>
      </SidebarInset>

      {selectedTab === "activities" && <Activity />}
      {selectedTab === "movements" && <Movement />}

      <PeriodActivitiesSummary periodDate={periodDate} />
    </>
  );
}
