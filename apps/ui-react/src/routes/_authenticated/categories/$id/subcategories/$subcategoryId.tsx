import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { eachDayOfInterval, startOfDay, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  SquareChartGantt,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { CategoryLabel } from "@/components/categories/category-label";
import { SubcategorySettingsDialog } from "@/components/categories/subcategory-settings-dialog";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useActivities, ACTIVITY_TYPES_CHART_COLOR } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute(
  "/_authenticated/categories/$id/subcategories/$subcategoryId",
)({
  component: SubcategoryPage,
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

function SubcategoryPage() {
  const { id: categoryId, subcategoryId } = Route.useParams();
  const subcategory = useActivities((state) =>
    state.getActivitySubcategoryById(subcategoryId),
  );
  if (!subcategory) {
    throw notFound();
  }

  const user = useAuth((state) => state.user!);
  const activities = useActivities((state) => state.activities);
  const focusedActivity = useActivities((state) => state.focusedActivity);

  const category = useActivities((state) =>
    state.getActivityCategoryById(subcategory.category),
  );
  if (!category) {
    throw notFound();
  }

  const currencyFormatter = useCurrencyFormatter();

  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    if (focusedActivity) {
      setSummaryOpen(false);
    }
  }, [focusedActivity]);

  const viewActivities = activities.filter(
    (a) => a.subcategory === subcategory.id,
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
      color:
        ACTIVITY_TYPES_CHART_COLOR[category.type] ?? "var(--color-red-400)",
    },
  } satisfies ChartConfig;

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
                  <BreadcrumbLink asChild>
                    <Link to={`/categories/$id`} params={{ id: categoryId }}>
                      <CategoryLabel categoryId={category.id} />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {subcategory.emoji && (
                      <span className="mr-2">{subcategory.emoji}</span>
                    )}
                    {subcategory.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <FilterActivitiesButton
              viewId={`subcategory-${subcategory.id}`}
              className="ml-2 text-muted-foreground"
            />
            <div className="flex-1" />
            <SearchBar />
            <AddActivityButton />
            {!summaryOpen && (
              <Button
                variant="secondary"
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
            <SubcategorySettingsDialog subcategory={subcategory}>
              <Button variant="ghost" size="icon">
                <Settings />
              </Button>
            </SubcategorySettingsDialog>
          </header>

          <ActivitiesTable
            viewId={`subcategory-${subcategory.id}`}
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
                  <div className="font-medium text-muted-foreground">Total</div>
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
                  <CartesianGrid vertical={false} />
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
                  <Bar dataKey="value" fill="var(--color-value)" />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </SidebarInset>

      <Activity />
    </>
  );
}
