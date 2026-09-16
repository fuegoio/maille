import type {
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";

import { createFileRoute, notFound } from "@tanstack/react-router";
import { eachDayOfInterval, startOfDay, subDays } from "date-fns";
import { Settings } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { ActivitiesAnalytics } from "@/components/analytics/activities-analytics";
import { CategoryLabel } from "@/components/categories/category-label";
import { SubcategorySettingsDialog } from "@/components/categories/subcategory-settings-dialog";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { PageBar } from "@/components/shared/page-bars";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  SIDE_PANEL_ICONS,
  SIDE_PANEL_LABELS,
  SidePanelToggles,
} from "@/components/ui/panel-toggles";
import { SidePanel } from "@/components/ui/side-panel";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { applyActivitiesFilters } from "@/logic/activities";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { usePanels } from "@/stores/panels";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

export const Route = createFileRoute(
  "/_authenticated/categories/$id/subcategories/$subcategoryId",
)({
  component: SubcategoryPageRoute,
  loader: async ({ params }) => {
    const activities = useActivities.getState();
    const subcategory = activities.getActivitySubcategoryById(
      params.subcategoryId,
    );
    if (!subcategory) {
      throw notFound();
    }

    return { subcategory };
  },
});

function SubcategoryPageRoute() {
  const { id: categoryId, subcategoryId } = Route.useParams();
  const subcategory = useActivities((state) =>
    state.getActivitySubcategoryById(subcategoryId),
  );
  const category = useActivities((state) =>
    state.getActivityCategoryById(subcategory?.category ?? ""),
  );
  if (!subcategory) {
    return (
      <DeletedRedirect
        target={{ to: "/categories/$id", params: { id: categoryId } }}
      />
    );
  }
  if (!category) {
    return <DeletedRedirect target={{ to: "/categories" }} />;
  }

  return (
    <SubcategoryPage
      categoryId={categoryId}
      subcategory={subcategory}
      category={category}
    />
  );
}

function SubcategoryPage({
  categoryId,
  subcategory,
  category,
}: {
  categoryId: string;
  subcategory: ActivitySubCategory;
  category: ActivityCategory;
}) {
  const user = useAuth((state) => state.user!);
  const activities = useActivities((state) => state.activities);

  const currencyFormatter = useCurrencyFormatter();

  const viewId = `subcategory-${subcategory.id}`;
  // This surface keeps its panel open by default, even on small screens.
  const panelState = usePanels((state) => state.getPanel(viewId, "summary"));
  const closePanel = usePanels((state) => state.closePanel);
  const setFullView = usePanels((state) => state.setFullView);

  const { search } = useViewSearch();
  const activityView = useViews((state) =>
    state.getActivityView(`subcategory-${subcategory.id}`),
  );

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/categories/$id/subcategories/$subcategoryId",
    entries: [
      { key: "categories", label: "Categories", target: { to: "/categories" } },
      {
        key: `category:${categoryId}`,
        label: <CategoryLabel categoryId={category.id} />,
        target: { to: "/categories/$id", params: { id: categoryId } },
      },
      {
        key: `subcategory:${subcategory.id}`,
        label: (
          <>
            {subcategory.emoji && (
              <span className="mr-2">{subcategory.emoji}</span>
            )}
            {subcategory.name}
          </>
        ),
        title: subcategory.name,
        target: {
          to: "/categories/$id/subcategories/$subcategoryId",
          params: { id: categoryId, subcategoryId: subcategory.id },
        },
      },
    ],
  });

  const viewActivities = activities.filter(
    (a) => a.subcategory === subcategory.id,
  );

  // The analytics panel describes exactly what the table shows.
  const filteredActivities = useMemo(
    () =>
      applyActivitiesFilters(viewActivities, {
        search,
        viewFilters: activityView.filters,
        subcategoryFilter: subcategory.id,
      }),
    [viewActivities, search, activityView, subcategory.id],
  );

  const subcategoryActivities = useMemo(
    () => activities.filter((a) => a.subcategory === subcategory.id),
    [activities, subcategory.id],
  );

  const totalOverall = useMemo(
    () => subcategoryActivities.reduce((acc, a) => acc + a.amount, 0),
    [subcategoryActivities],
  );

  const total30Days = useMemo(() => {
    const cutoff = startOfDay(subDays(new Date(), 30));
    return subcategoryActivities
      .filter((a) => startOfDay(a.date) >= cutoff)
      .reduce((acc, a) => acc + a.amount, 0);
  }, [subcategoryActivities]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: user.startingDate,
        end: new Date(),
      }),
    [user.startingDate],
  );

  const chartData = useMemo(
    () =>
      days.map((date) => {
        const d = startOfDay(date);
        return {
          date: date.toISOString(),
          value: subcategoryActivities
            .filter((a) => startOfDay(a.date).getTime() === d.getTime())
            .reduce((acc, a) => acc + a.amount, 0),
        };
      }),
    [days, subcategoryActivities],
  );

  const chartConfig = {
    views: { label: "Total" },
    value: {
      label: "Amount",
      color: "var(--color-red-400)",
    },
  } satisfies ChartConfig;

  return (
    <SidebarInset className="flex-row">
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          panelState.panel !== null && panelState.fullView && "hidden",
        )}
      >
        <PageBar>
          <SidebarTrigger className="mr-1" />

          <PageBreadcrumbs entries={breadcrumbs} />
          <FilterActivitiesButton
            viewId={`subcategory-${subcategory.id}`}
            className="ml-2 text-muted-foreground"
          />
          <div className="flex-1" />
          <SearchBar />
          <AddActivityButton
            category={category.id}
            subcategory={subcategory.id}
          />
          <SidePanelToggles
            viewId={viewId}
            panels={["analytics", "summary"]}
            defaultPanel="summary"
          />
          <SubcategorySettingsDialog subcategory={subcategory}>
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </SubcategorySettingsDialog>
        </PageBar>

        <ActivitiesTable
          viewId={`subcategory-${subcategory.id}`}
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
            <>
              {/* KPIs + chart */}
              <div className="w-full border-b">
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">Last 30 days</div>
                    <div className="flex-1" />
                    <span className="font-mono">
                      {currencyFormatter.format(total30Days)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center text-sm">
                    <div className="font-medium text-muted-foreground">
                      Total
                    </div>
                    <div className="flex-1" />
                    <span className="font-mono text-muted-foreground">
                      {currencyFormatter.format(totalOverall)}
                    </span>
                  </div>
                </div>

                <ChartContainer
                  config={chartConfig}
                  className="aspect-auto h-[180px] w-full border-t p-3"
                >
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical strokeDasharray="2 3" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className="w-[150px]"
                          nameKey="views"
                          formatter={(value) =>
                            currencyFormatter.format(value as number)
                          }
                          labelFormatter={(value) =>
                            new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      maxBarSize={18}
                      radius={[2, 2, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </>
          )}

          {panelState.panel === "analytics" && (
            <ActivitiesAnalytics
              activities={filteredActivities}
              viewId="subcategories-activities"
              defaults={{
                y: "net",
                x: "month",
                groupBy: "none",
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
