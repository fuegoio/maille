import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useStore } from "zustand";
import { activitiesStore } from "@/stores/activities";
import { viewsStore } from "@/stores/views";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo } from "react";
import { Activity } from "@/components/activities/activity";

export const Route = createFileRoute("/_authenticated/_workspace/activities/{-$id}")({
  component: ActivitiesPage,
});

function ActivitiesPage() {
  const params = Route.useParams();
  const activities = useStore(activitiesStore, (state) => state.activities);
  const setFocusedActivity = activitiesStore.getState().setFocusedActivity;

  // Get the activity view based on route parameters
  const activityView = useStore(viewsStore, (state) =>
    state.getActivityView(
      params.id === "reconciliation" ? "activities-reconciliate-page" : "activities-page",
    ),
  );

  // Filter activities based on route parameters
  const viewActivities = useMemo(() => {
    if (params.id === "reconciliation") {
      return activities.filter((activity) => activity.status === "incomplete");
    }
    return activities;
  }, [activities, params.id]);

  // Handle route parameter changes for focused activity
  useEffect(() => {
    if (params.id && params.id !== "reconciliation" && params.id !== "") {
      const activity = activities.find((a) => a.number.toString() === params.id);
      if (activity) {
        setFocusedActivity(activity.id);
      }
    } else {
      setFocusedActivity(null);
    }
  }, [params.id, activities]);

  const title = params.id === "reconciliation" ? "Activities to reconciliate" : "Activities";

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b pr-4 pl-14 lg:pl-8">
        <div className="truncate text-sm font-semibold text-white">{title}</div>
        <div className="flex-1 sm:hidden" />
        {activityView.filters.length === 0 && (
          <>
            <FilterActivitiesButton viewId={activityView.id} className="ml-4 sm:mr-2" />
            <ExportActivitiesButton
              className="hidden sm:block"
              viewId={activityView.id}
              activities={viewActivities}
            />
          </>
        )}
        <div className="hidden flex-1 sm:block" />
        <div className="relative">
          <SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search activities..."
            className="w-[200px] pl-8 sm:w-[300px]"
          />
        </div>
        <AddActivityButton className="mr-3" />
        <Button size="sm" className="gap-1">
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Show Transactions</span>
        </Button>
      </header>

      <div className="bg-primary-900 flex flex-1 flex-col rounded border p-4 shadow-xl">
        <ActivitiesTable viewId={activityView.id} activities={viewActivities} grouping="period" />
      </div>

      <Activity viewId={activityView.id} />
    </>
  );
}
