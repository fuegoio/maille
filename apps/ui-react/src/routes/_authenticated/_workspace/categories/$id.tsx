import { createFileRoute, notFound } from "@tanstack/react-router";
import { eachDayOfInterval } from "date-fns";
import { Settings } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
import { CategoryLabel } from "@/components/categories/category-label";
import { CategorySettingsDialog } from "@/components/categories/category-settings-dialog";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrencyFormatter } from "@/lib/utils";
import { useActivities } from "@/stores/activities";

export const Route = createFileRoute(
  "/_authenticated/_workspace/categories/$id",
)({
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

  const { workspace } = Route.useRouteContext();
  const activities = useActivities((state) => state.activities);

  const currencyFormatter = getCurrencyFormatter();

  const viewActivities = activities.filter((a) => {
    return a.category === category.id;
  });

  const getCategoryTotal = (date?: string) => {
    return activities
      .filter((a) => (date ? a.date <= new Date(date) : true))
      .filter((a) => a.category === category.id)
      .reduce((acc, a) => {
        return acc + a.amount;
      }, 0);
  };

  const days = eachDayOfInterval({
    start: workspace.startingDate,
    end: new Date(),
  });

  const chartData = days.map((date) => {
    return {
      date: date.toISOString(),
      value: getCategoryTotal(date.toISOString()),
    };
  });

  const chartConfig = {
    views: {
      label: "Category Evolution",
    },
    value: {
      label: "Amount",
      color: "var(--color-red-400)",
    },
  } satisfies ChartConfig;

  return (
    <>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />
          <CategoryLabel categoryId={category.id} />
          <div className="flex-1" />
          <CategorySettingsDialog category={category}>
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </CategorySettingsDialog>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="m-4 rounded-lg border">
            <div className="grid grid-cols-2 border-b">
              {(
                [
                  {
                    id: "total",
                    name: "Total",
                    value: getCategoryTotal(),
                  },
                ] as const
              ).map((kpi) => {
                return (
                  <div
                    key={kpi.name}
                    className="flex flex-1 cursor-pointer flex-col justify-center gap-1 border-r px-6 py-8
                text-left transition-colors last:border-r-0 hover:bg-muted/50"
                  >
                    <div className="flex items-center text-xs text-muted-foreground">
                      {kpi.name}
                    </div>
                    <span className="font-mono text-lg leading-none font-semibold sm:text-3xl">
                      {currencyFormatter.format(kpi.value)}
                    </span>
                  </div>
                );
              })}
            </div>

            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full py-4"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
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
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                    />
                  }
                />
                <Bar dataKey="value" fill={`var(--color-value)`} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="flex items-center border-t border-b py-3 pr-4 pl-6 font-medium">
            Activities
          </div>
          <ActivitiesTable
            viewId={`category-${category.id}`}
            activities={viewActivities}
            grouping="period"
          />
        </div>
      </SidebarInset>

      <Activity />
    </>
  );
}

