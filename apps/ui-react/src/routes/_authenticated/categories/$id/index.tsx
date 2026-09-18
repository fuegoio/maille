import type { ActivityCategory } from "@maille/core/activities";

import { createFileRoute, notFound } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useMemo } from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { ActivitiesAnalytics } from "@/components/analytics/activities-analytics";
import { CategoryLabel } from "@/components/categories/category-label";
import { CategorySettingsDialog } from "@/components/categories/category-settings-dialog";
import { CategorySummary } from "@/components/categories/category-summary";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { Button } from "@/components/ui/button";
import {
  SIDE_PANEL_ICONS,
  SIDE_PANEL_LABELS,
  SidePanelToggles,
} from "@/components/ui/panel-toggles";
import { SidePanel } from "@/components/ui/side-panel";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { applyActivitiesFilters } from "@/logic/activities";
import { useActivities } from "@/stores/activities";
import { usePanels } from "@/stores/panels";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

export const Route = createFileRoute("/_authenticated/categories/$id/")({
  component: CategoryPageRoute,
  loader: async ({ params }) => {
    const activities = useActivities.getState();
    const category = activities.getActivityCategoryById(params.id);
    if (!category) {
      throw notFound();
    }

    return { category };
  },
});

function CategoryPageRoute() {
  const categoryId = Route.useParams().id;
  const category = useActivities((state) =>
    state.getActivityCategoryById(categoryId),
  );
  if (!category) {
    return <DeletedRedirect target={{ to: "/categories" }} />;
  }

  return <CategoryPage category={category} />;
}

function CategoryPage({ category }: { category: ActivityCategory }) {
  const activities = useActivities((state) => state.activities);

  const isMobile = useIsMobile();
  const viewId = `category-${category.id}`;
  const defaultPanel = isMobile ? null : "summary";
  const panelState = usePanels((state) => state.getPanel(viewId, defaultPanel));
  const closePanel = usePanels((state) => state.closePanel);
  const setFullView = usePanels((state) => state.setFullView);

  const { search } = useViewSearch();
  const activityView = useViews((state) =>
    state.getActivityView(`category-${category.id}`),
  );

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/categories/$id",
    entries: [
      { key: "categories", label: "Categories", target: { to: "/categories" } },
      {
        key: `category:${category.id}`,
        label: <CategoryLabel categoryId={category.id} />,
        target: { to: "/categories/$id", params: { id: category.id } },
      },
    ],
  });

  const viewActivities = activities.filter((a) => a.category === category.id);

  // The analytics panel describes exactly what the table shows.
  const filteredActivities = useMemo(
    () =>
      applyActivitiesFilters(viewActivities, {
        search,
        viewFilters: activityView.filters,
        categoryFilter: category.id,
      }),
    [viewActivities, search, activityView, category.id],
  );

  return (
    <SidebarInset className="flex-row">
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          panelState.panel !== null &&
            (isMobile || panelState.fullView) &&
            "hidden",
        )}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />

          <PageBreadcrumbs entries={breadcrumbs} />
          <FilterActivitiesButton
            viewId={`category-${category.id}`}
            className="ml-2 text-muted-foreground"
          />
          <div className="flex-1" />
          <SearchBar />
          <AddActivityButton category={category.id} />
          <SidePanelToggles
            viewId={viewId}
            panels={["analytics", "summary"]}
            defaultPanel={defaultPanel}
          />
          <CategorySettingsDialog category={category}>
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </CategorySettingsDialog>
        </header>

        <ActivitiesTable
          viewId={`category-${category.id}`}
          activities={viewActivities}
          grouping="period"
        />
      </div>

      {panelState.panel !== null && (
        <SidePanel
          title={
            panelState.panel ? SIDE_PANEL_LABELS[panelState.panel] : "Panel"
          }
          icon={
            panelState.panel ? SIDE_PANEL_ICONS[panelState.panel] : undefined
          }
          onClose={() => closePanel(viewId)}
          fullView={panelState.fullView && panelState.panel === "analytics"}
          onToggleFullView={
            panelState.panel === "analytics"
              ? () => setFullView(viewId, !panelState.fullView)
              : undefined
          }
          scrollable={panelState.panel !== "analytics"}
        >
          {panelState.panel === "summary" && (
            <CategorySummary category={category} />
          )}

          {panelState.panel === "analytics" && (
            <ActivitiesAnalytics
              activities={filteredActivities}
              viewId="categories-activities"
              defaults={{
                y: "net",
                x: "month",
                groupBy: "subcategory",
                chart: "bar",
              }}
              fullView={panelState.fullView}
            />
          )}
        </SidePanel>
      )}
    </SidebarInset>
  );
}
