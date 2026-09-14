import type { ActivityCategory } from "@maille/core/activities";

import { ActivityType } from "@maille/core/activities";
import { Link } from "@tanstack/react-router";
import { eachDayOfInterval, startOfDay, subDays } from "date-fns";
import { ArrowRight, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { CreateSubcategoryDialog } from "@/components/categories/create-subcategory-dialog";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

interface CategorySummaryProps {
  category: ActivityCategory;
}

export function CategorySummary({ category }: CategorySummaryProps) {
  const currencyFormatter = useCurrencyFormatter();
  const user = useAuth((state) => state.user!);
  const activities = useActivities((state) => state.activities);
  const subcategories = useActivities((state) => state.activitySubcategories);

  const categoryActivities = useMemo(
    () => activities.filter((a) => a.category === category.id),
    [activities, category.id],
  );

  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 29);

  // The category's balance: revenue counted as plus, expense as minus,
  // investment and neutral stay out, mirroring the accounts and funds
  // summaries.
  const getBalanceAtDate = (date: Date) =>
    categoryActivities
      .filter((a) => a.date >= user.startingDate)
      .filter((a) => startOfDay(a.date) <= date)
      .reduce(
        (acc, a) =>
          acc +
          a.amounts[ActivityType.REVENUE] -
          a.amounts[ActivityType.EXPENSE],
        0,
      );

  const balance = getBalanceAtDate(today);
  const balancePrev = getBalanceAtDate(thirtyDaysAgo);

  const last30 = categoryActivities.filter(
    (a) => startOfDay(a.date) >= thirtyDaysAgo,
  );
  const last30In = last30.reduce(
    (acc, a) => acc + a.amounts[ActivityType.REVENUE],
    0,
  );
  const last30Out = Math.abs(
    last30.reduce((acc, a) => acc + a.amounts[ActivityType.EXPENSE], 0),
  );

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: thirtyDaysAgo,
        end: today,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const chartData = useMemo(
    () =>
      days.map((date) => ({
        date: date.toISOString(),
        balance: getBalanceAtDate(startOfDay(date)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, categoryActivities],
  );

  const chartConfig = {
    views: { label: "Balance" },
    balance: {
      label: "Balance",
      color: "var(--color-primary)",
    },
  } satisfies ChartConfig;

  const categorySubcategories = useMemo(
    () =>
      subcategories
        .filter((sc) => sc.category === category.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [subcategories, category.id],
  );

  const subcategoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    categorySubcategories.forEach((sc) => {
      totals[sc.id] = activities
        .filter((a) => a.subcategory === sc.id)
        .reduce(
          (acc, a) =>
            acc +
            a.amounts[ActivityType.REVENUE] -
            a.amounts[ActivityType.EXPENSE],
          0,
        );
    });
    return totals;
  }, [activities, categorySubcategories]);

  return (
    <div>
      {/* KPIs + chart */}
      <div className="w-full border-b">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="font-semibold">Balance</div>
            <div className="flex-1" />
            <span className="font-mono text-muted-foreground">
              {currencyFormatter.format(balancePrev)}
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
            <span className="font-mono">
              {currencyFormatter.format(balance)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <TrendingUp className="size-3" />
            <div className="font-medium">In</div>
            <div className="flex-1" />
            <span className="flex items-center gap-1 font-mono font-medium">
              {currencyFormatter.format(last30In)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <TrendingDown className="size-3" />
            <div className="font-medium">Out</div>
            <div className="flex-1" />
            <span className="flex items-center gap-1 font-mono font-medium">
              {currencyFormatter.format(last30Out)}
            </span>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[180px] w-full border-t p-3"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical strokeDasharray="2 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              minTickGap={20}
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
                  className="w-[160px]"
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
            <YAxis domain={["auto", "auto"]} hide />
            <Line
              type="stepAfter"
              dataKey="balance"
              stroke="var(--color-balance)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Subcategories */}
      <div className="w-full border-b px-3 py-4">
        <div className="mb-1 flex h-10 items-center justify-between rounded px-3">
          <span className="font-medium">Subcategories</span>
          <CreateSubcategoryDialog categoryId={category.id}>
            <Button variant="ghost" size="icon">
              <Plus />
            </Button>
          </CreateSubcategoryDialog>
        </div>

        {categorySubcategories.length === 0 && (
          <div className="px-3 py-3 text-sm text-muted-foreground">
            No subcategories yet
          </div>
        )}

        {categorySubcategories.map((sc) => (
          <Link
            key={sc.id}
            to="/categories/$id/subcategories/$subcategoryId"
            params={{ id: category.id, subcategoryId: sc.id }}
            className="group flex h-9 items-center rounded px-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {sc.emoji && <span>{sc.emoji}</span>}
              <span>{sc.name}</span>
            </div>
            <div className="flex-1" />
            <span className="pr-2 font-mono text-sm whitespace-nowrap">
              {currencyFormatter.format(subcategoryTotals[sc.id] ?? 0)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
