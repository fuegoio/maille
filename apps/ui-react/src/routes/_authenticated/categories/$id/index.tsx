import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  SquareChartGantt,
} from "lucide-react";
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

  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    if (focusedActivity) {
      setSummaryOpen(false);
    }
  }, [focusedActivity]);

  const viewActivities = activities.filter((a) => a.category === category.id);

  return (
    <>
      <SidebarInset className="flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
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
            <AddActivityButton />
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

        {summaryOpen && (
          <div className="h-full w-full max-w-md overflow-y-auto border-l bg-muted/30">
            <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSummaryOpen(false)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="text-sm font-medium">Summary</div>
            </div>

            <CategorySummary category={category} />
          </div>
        )}
      </SidebarInset>

      <Activity />
    </>
  );
}
