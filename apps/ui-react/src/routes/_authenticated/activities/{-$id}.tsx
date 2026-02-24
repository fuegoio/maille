import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
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
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useViews } from "@/stores/views";

export const Route = createFileRoute("/_authenticated/activities/{-$id}")({
  component: ActivitiesPage,
  loader: async ({ params }) => {
    const setFocusedActivity = useActivities.getState().setFocusedActivity;
    if (params.id && params.id !== "to-reconciliate" && params.id !== "") {
      const activities = useActivities.getState().activities;
      const activity = activities.find(
        (a) => a.number.toString() === params.id,
      );
      if (activity) {
        setFocusedActivity(activity.id);
      }
    } else {
      setFocusedActivity(null);
    }
  },
});

function ActivitiesPage() {
  const params = Route.useParams();
  const focusedActivity = useActivities((state) => state.focusedActivity);
  const activities = useActivities((state) => state.activities);
  const showTransactions = useActivities((state) => state.showTransactions);
  const setShowTransactions = useActivities(
    (state) => state.setShowTransactions,
  );

  // Get the activity view based on route parameters
  const activityView = useViews((state) =>
    state.getActivityView(
      params.id === "to-reconciliate"
        ? "activities-reconciliate-page"
        : "activities-page",
    ),
  );

  // Filter activities based on route parameters
  const viewActivities = useMemo(() => {
    if (params.id === "to-reconciliate") {
      return activities.filter((activity) => activity.status === "incomplete");
    }
    return activities;
  }, [activities, params.id]);

  const title =
    params.id === "to-reconciliate" ? "To reconciliate" : "Activities";

  return (
    <>
      <SidebarInset
        className={cn("min-w-0 shrink", focusedActivity && "hidden xl:flex")}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-3 sm:pl-4">
          <SidebarTrigger className="mr-1" />
          <Breadcrumb>
            <BreadcrumbList>
              {params.id === "to-reconciliate" && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/activities/{-$id}" params={{ id: undefined }}>
                        Activities
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
          <AddActivityButton />
          <Button
            className="hidden gap-1 sm:flex"
            variant="outline"
            onClick={() => setShowTransactions(!showTransactions)}
          >
            {showTransactions ? "Hide" : "Show"} transactions
          </Button>
          <div className="h-full w-px shrink-0 bg-border" />
          <ExportActivitiesButton
            viewId={activityView.id}
            activities={viewActivities}
          />
        </header>

        <header className="flex h-11 shrink-0 items-center gap-2 border-b px-2 sm:pl-11.25">
          {activityView.filters.length === 0 && (
            <FilterActivitiesButton viewId={activityView.id} />
          )}
          <div className="flex-1" />
          <SearchBar />
        </header>

        <ActivitiesTable
          viewId={activityView.id}
          activities={viewActivities}
          grouping="period"
        />
      </SidebarInset>

      <Activity />
    </>
  );
}
