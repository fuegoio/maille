import { createFileRoute } from "@tanstack/react-router";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useActivities } from "@/stores/activities";
import { useViews } from "@/stores/views";

export const Route = createFileRoute("/_authenticated/activities/")({
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const activities = useActivities((state) => state.activities);
  const showTransactions = useActivities((state) => state.showTransactions);
  const setShowTransactions = useActivities(
    (state) => state.setShowTransactions,
  );

  const activityView = useViews((state) =>
    state.getActivityView("activities-page"),
  );

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/activities",
    entries: [{ key: "activities", label: "Activities" }],
  });

  return (
    <SidebarInset className="min-w-0 shrink">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b pr-2 pl-3 sm:gap-2 sm:pl-4">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
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
        <div className="hidden h-full w-px bg-border sm:block" />
        <ExportActivitiesButton
          viewId={activityView.id}
          activities={activities}
          className="hidden sm:flex"
        />
      </header>

      <ActivitiesTable
        viewId={activityView.id}
        activities={activities}
        grouping="period"
      />
    </SidebarInset>
  );
}
