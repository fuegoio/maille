import { createFileRoute } from "@tanstack/react-router";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { ActivityViewSettingsButton } from "@/components/activities/activity-view-settings-button";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { PageBar } from "@/components/shared/page-bars";
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

  const activityView = useViews((state) =>
    state.getActivityView("activities-reconciliate-page"),
  );

  const viewActivities = activities.filter(
    (activity) => activity.status === "incomplete",
  );

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/activities/to-reconciliate",
    entries: [
      { key: "activities", label: "Activities", target: { to: "/activities" } },
      {
        key: "to-reconciliate",
        label: "Needs reconciliation",
        target: { to: "/activities/to-reconciliate" },
      },
    ],
  });

  return (
    <SidebarInset className="min-w-0 shrink">
      <PageBar className="gap-1 pr-2 sm:gap-2">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <FilterActivitiesButton
          viewId={activityView.id}
          className="ml-2 text-muted-foreground"
        />
        <div className="flex-1" />
        <SearchBar />
        <AddActivityButton variant="default" />
        <div className="hidden h-full w-px bg-border sm:block" />
        <ActivityViewSettingsButton viewId={activityView.id} />
        <ExportActivitiesButton
          viewId={activityView.id}
          activities={viewActivities}
          className="hidden sm:flex"
        />
      </PageBar>

      <ActivitiesTable
        viewId={activityView.id}
        activities={viewActivities}
        groupings={["none", "period"]}
      />
    </SidebarInset>
  );
}
