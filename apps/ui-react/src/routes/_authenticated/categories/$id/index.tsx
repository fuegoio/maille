import type { ActivityCategory } from "@maille/core/activities";

import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useState } from "react";
import z from "zod";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { ActivityViewSettingsButton } from "@/components/activities/activity-view-settings-button";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
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
import { ViewActions } from "@/components/shared/view-actions";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import { ViewSelect } from "@/components/views/view-select";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ActivityIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

const searchParamsSchema = z.object({
  /** "activities", or a custom view's id. */
  view: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/categories/$id/")({
  component: CategoryPageRoute,
  validateSearch: searchParamsSchema,
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
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "activities";
  const activities = useActivities((state) => state.activities);

  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);

  const viewScope = { kind: "category", categoryId: category.id } as const;
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

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
          <div className="flex-1" />
          <SearchBar />
          {selectedCustomView === null && (
            <AddActivityButton category={category.id} />
          )}
          <CategorySettingsDialog category={category}>
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </CategorySettingsDialog>
        </header>

        <Tabs
          value={selectedTab}
          onValueChange={(value) =>
            navigate({
              to: ".",
              search: (prev) => ({
                ...prev,
                view: value === "activities" ? undefined : value,
              }),
            })
          }
          className="min-h-0 flex-1"
        >
          <header className="@container flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
            <ViewSelect
              className="sm:hidden"
              scope={viewScope}
              value={selectedTab}
              onSelect={(value) =>
                navigate({
                  to: ".",
                  search: (prev) => ({
                    ...prev,
                    view: value,
                  }),
                })
              }
              builtIn={[
                {
                  value: "activities",
                  label: "Activities",
                  icon: ActivityIcon,
                },
              ]}
            />
            <TabsList
              height="full"
              className="hidden min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 sm:flex [&_[data-slot=tabs-trigger]]:after:bottom-0"
            >
              <TabsTrigger value="activities">
                <ActivityIcon />
                Activities
              </TabsTrigger>
              <CustomViewTabs
                scope={viewScope}
                onSelect={(value) =>
                  navigate({
                    to: ".",
                    search: (prev) => ({ ...prev, view: value }),
                  })
                }
              />
            </TabsList>
            <div className="flex-1" />
            {selectedCustomView !== null ? (
              <CustomViewActions
                view={selectedCustomView}
                onConfigChange={(config) =>
                  updateViewConfig(selectedCustomView, config)
                }
                onDeleted={() =>
                  navigate({
                    to: ".",
                    search: (prev) => ({ ...prev, view: undefined }),
                  })
                }
              />
            ) : (
              <>
                <ViewActions>
                  <FilterActivitiesButton viewId={`category-${category.id}`} />
                  <ActivityViewSettingsButton
                    viewId={`category-${category.id}`}
                  />
                  <ExportActivitiesButton
                    viewId={`category-${category.id}`}
                    activities={viewActivities}
                  />
                </ViewActions>
              </>
            )}
          </header>

          <TabsContent value="activities" className="flex h-full">
            <ActivitiesTable
              viewId={`category-${category.id}`}
              activities={viewActivities}
            />
          </TabsContent>

          <CustomViewTabsContent scope={viewScope} />
        </Tabs>
      </div>

      <SummaryPanel
        open={summaryOpen}
        onOpen={() => setSummaryOpen(true)}
        onClose={() => setSummaryOpen(false)}
      >
        <CategorySummary category={category} />
      </SummaryPanel>
    </SidebarInset>
  );
}
