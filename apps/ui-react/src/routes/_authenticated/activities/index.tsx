import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CircleCheck, CircleDashed } from "lucide-react";
import z from "zod";

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
import { ViewActions } from "@/components/shared/view-actions";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import { ViewSelect } from "@/components/views/view-select";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";
import { ActivityIcon } from "@/lib/icons";
import { useActivities } from "@/stores/activities";

const searchParamsSchema = z.object({
  /** "all", "until-now", "reconcile", or a custom view's id. */
  view: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/activities/")({
  component: ActivitiesPage,
  validateSearch: searchParamsSchema,
});

/**
 * The stored view configuration behind each built-in tab, so its filters,
 * ordering and grouping stay independent per tab.
 */
const activitiesViewId = (tab: string) =>
  tab === "reconcile"
    ? "activities-reconciliate-page"
    : tab === "until-now"
      ? "activities-until-now-page"
      : "activities-page";

/** The scope this page's custom views attach to. */
const viewScope = { kind: "page", page: "activities" } as const;

const endOfToday = () => {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();
};

function ActivitiesPage() {
  const activities = useActivities((state) => state.activities);
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "until-now";
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const viewActivities =
    selectedTab === "reconcile"
      ? activities.filter((activity) => activity.status === "incomplete")
      : selectedTab === "until-now"
        ? activities.filter(
            (activity) => activity.date.getTime() <= endOfToday(),
          )
        : activities;

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/activities",
    entries: [
      { key: "activities", label: "Activities", target: { to: "/activities" } },
    ],
  });

  const selectTab = (value: string) => {
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        view: value === "until-now" ? undefined : value,
      }),
    });
  };

  return (
    <SidebarInset className="min-w-0 shrink">
      <PageBar className="gap-1 pr-2 sm:gap-2">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <SearchBar />
        <AddActivityButton variant="default" hotkey />
      </PageBar>

      <Tabs
        value={selectedTab}
        onValueChange={selectTab}
        className="min-h-0 flex-1"
      >
        <header className="@container flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
          <ViewSelect
            className="sm:hidden"
            scope={viewScope}
            value={selectedTab}
            onSelect={selectTab}
            builtIn={[
              { value: "until-now", label: "Until now", icon: CircleCheck },
              { value: "all", label: "All activities", icon: ActivityIcon },
              {
                value: "reconcile",
                label: "Needs reconciliation",
                icon: CircleDashed,
              },
            ]}
          />
          <TabsList
            height="full"
            className="hidden min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 sm:flex [&_[data-slot=tabs-trigger]]:after:bottom-0"
          >
            <TabsTrigger value="until-now">
              <CircleCheck />
              Until now
            </TabsTrigger>
            <TabsTrigger value="all">
              <ActivityIcon />
              All activities
            </TabsTrigger>
            <TabsTrigger value="reconcile">
              <CircleDashed />
              Needs reconciliation
            </TabsTrigger>
            <CustomViewTabs scope={viewScope} onSelect={selectTab} />
          </TabsList>
          <div className="flex-1" />
          {selectedCustomView !== null ? (
            <CustomViewActions
              view={selectedCustomView}
              onConfigChange={(config) =>
                updateViewConfig(selectedCustomView, config)
              }
              onDeleted={() => selectTab("until-now")}
            />
          ) : (
            <>
              <ViewActions>
                <FilterActivitiesButton
                  viewId={activitiesViewId(selectedTab)}
                />
                <ActivityViewSettingsButton
                  viewId={activitiesViewId(selectedTab)}
                />
                <ExportActivitiesButton
                  viewId={activitiesViewId(selectedTab)}
                  activities={viewActivities}
                />
              </ViewActions>
            </>
          )}
        </header>

        <TabsContent value="until-now" className="flex h-full">
          <ActivitiesTable
            viewId="activities-until-now-page"
            activities={viewActivities}
          />
        </TabsContent>

        <TabsContent value="all" className="flex h-full">
          <ActivitiesTable viewId="activities-page" activities={activities} />
        </TabsContent>

        <TabsContent value="reconcile" className="flex h-full">
          <ActivitiesTable
            viewId="activities-reconciliate-page"
            activities={viewActivities}
          />
        </TabsContent>

        <CustomViewTabsContent scope={viewScope} />
      </Tabs>
    </SidebarInset>
  );
}
