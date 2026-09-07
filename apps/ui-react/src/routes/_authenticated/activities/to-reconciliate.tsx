import { createFileRoute, Link } from "@tanstack/react-router";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
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
import { useActivities } from "@/stores/activities";
import { useViews } from "@/stores/views";

export const Route = createFileRoute(
  "/_authenticated/activities/to-reconciliate",
)({
  component: ToReconciliatePage,
});

function ToReconciliatePage() {
  const activities = useActivities((state) => state.activities);
  const showTransactions = useActivities((state) => state.showTransactions);
  const setShowTransactions = useActivities(
    (state) => state.setShowTransactions,
  );

  const activityView = useViews((state) =>
    state.getActivityView("activities-reconciliate-page"),
  );

  const viewActivities = activities.filter(
    (activity) => activity.status === "incomplete",
  );

  return (
    <SidebarInset className="min-w-0 shrink">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b pr-2 pl-3 sm:gap-2 sm:pl-4">
        <SidebarTrigger className="sm:mr-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/activities">Activities</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>To reconciliate</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <FilterActivitiesButton
          viewId={activityView.id}
          className="ml-2 text-muted-foreground"
        />
        <div className="flex-1" />
        <SearchBar />
        <AddActivityButton />
        <Button
          className="hidden gap-1 sm:flex"
          variant="outline"
          onClick={() => setShowTransactions(!showTransactions)}
        >
          {showTransactions ? "Hide" : "Show"} transactions
        </Button>
        <div className="hidden h-full w-px shrink-0 bg-border sm:block" />
        <ExportActivitiesButton
          viewId={activityView.id}
          activities={viewActivities}
          className="hidden sm:flex"
        />
      </header>

      <ActivitiesTable
        viewId={activityView.id}
        activities={viewActivities}
        grouping="period"
      />
    </SidebarInset>
  );
}
