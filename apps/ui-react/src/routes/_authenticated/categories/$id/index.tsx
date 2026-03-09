import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Settings, SquareChartGantt } from "lucide-react";
import { useEffect, useState } from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { CategoryLabel } from "@/components/categories/category-label";
import { CategorySettingsDialog } from "@/components/categories/category-settings-dialog";
import { CategorySummary } from "@/components/categories/category-summary";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

export const Route = createFileRoute("/_authenticated/categories/$id/")({
  component: CategoryPage,
  loader: async ({ params }) => {
    const activities = useActivities.getState();
    const category = activities.getActivityCategoryById(params.id);
    if (!category) {
      throw notFound();
    }

    return { category };
  },
});

function CategoryPage() {
  const categoryId = Route.useParams().id;
  const category = useActivities((state) =>
    state.getActivityCategoryById(categoryId),
  );
  if (!category) {
    throw notFound();
  }

  const activities = useActivities((state) => state.activities);
  const focusedActivity = useActivities((state) => state.focusedActivity);

  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);

  useEffect(() => {
    if (focusedActivity) {
      setSummaryOpen(false);
    }
  }, [focusedActivity]);

  const viewActivities = activities.filter((a) => a.category === category.id);

  return (
    <>
      <SidebarInset className="flex-row">
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            summaryOpen && "hidden md:flex",
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
            <SidebarTrigger className="mr-1" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/categories">Categories</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <CategoryLabel categoryId={category.id} />
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <FilterActivitiesButton
              viewId={`category-${category.id}`}
              className="ml-2 text-muted-foreground"
            />
            <div className="flex-1" />
            <SearchBar />
            <AddActivityButton type={category.type} category={category.id} />
            {!summaryOpen && (
              <Button
                variant="outline"
                onClick={() => setSummaryOpen(true)}
                size={focusedActivity ? "icon" : "default"}
              >
                <SquareChartGantt />
                {!focusedActivity && (
                  <>
                    Summary
                    <ChevronRight />
                  </>
                )}
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

      <Activity />
    </>
  );
}
