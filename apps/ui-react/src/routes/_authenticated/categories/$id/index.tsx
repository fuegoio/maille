import type { ActivityCategory } from "@maille/core/activities";

import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChevronRight, Settings, SquareChartGantt } from "lucide-react";
import { useState } from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
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
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

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
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);

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

  return (
    <SidebarInset className="flex-row">
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          summaryOpen && "hidden md:flex",
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
          {!summaryOpen && (
            <Button
              variant="outline"
              aria-label="Show summary"
              onClick={() => setSummaryOpen(true)}
            >
              <SquareChartGantt />
              <span className="hidden sm:inline">Summary</span>
              <ChevronRight className="hidden sm:block" />
            </Button>
          )}
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

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
        <CategorySummary category={category} />
      </SummaryPanel>
    </SidebarInset>
  );
}
