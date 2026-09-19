import { AccountType } from "@maille/core/accounts";
import { subDays } from "date-fns";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";

import { RollingAmount } from "@/components/ui/rolling-amount";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

import type { HomeDateRange } from "./use-home-date-range";

import { getBalanceAtDate, getFlowTotalBetweenDates } from "./ledger-metrics";

export type Kpi = "balance" | "revenue" | "expense";

interface KpiSpec {
  id: Kpi;
  name: string;
  icon: typeof ArrowRight;
  color: string;
  /** The direction in which a change reads as good news. */
  goodDirection: "up" | "down";
}

/**
 * The KPI strip: the three ledger figures of the selected range, doubling
 * as the chart's metric switcher. Each value carries its change against
 * the equivalent previous window.
 */
export function HomeKpis({
  range,
  activeChart,
  onActiveChartChange,
}: {
  range: HomeDateRange;
  activeChart: Kpi;
  onActiveChartChange: (kpi: Kpi) => void;
}) {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user!);

  const kpiSpecs: KpiSpec[] = [
    {
      id: "balance",
      name: "Balance",
      icon: ArrowRight,
      color: "var(--color-primary)",
      goodDirection: "up",
    },
    {
      id: "revenue",
      name: "Revenue",
      icon: TrendingUp,
      color: "var(--color-activity-revenue)",
      goodDirection: "up",
    },
    {
      id: "expense",
      name: "Expense",
      icon: TrendingDown,
      color: "var(--color-activity-expense)",
      goodDirection: "down",
    },
  ];

  const totals = useMemo(() => {
    const previousEnd = range.previous
      ? range.previous.to
      : subDays(range.from, 1);

    const balance = getBalanceAtDate({
      accounts,
      activities,
      startingDate: user.startingDate,
      date: range.to,
    });
    const balancePrevious = getBalanceAtDate({
      accounts,
      activities,
      startingDate: user.startingDate,
      date: previousEnd,
    });

    const flowTotal = (
      type: AccountType.REVENUE | AccountType.EXPENSE,
      from: Date,
      to: Date,
    ) =>
      getFlowTotalBetweenDates({
        accounts,
        activities,
        startingDate: user.startingDate,
        from,
        to,
        type,
      });

    return {
      balance,
      balancePrevious,
      revenue: flowTotal(AccountType.REVENUE, range.from, range.to),
      revenuePrevious: range.previous
        ? flowTotal(AccountType.REVENUE, range.previous.from, range.previous.to)
        : 0,
      expense: flowTotal(AccountType.EXPENSE, range.from, range.to),
      expensePrevious: range.previous
        ? flowTotal(AccountType.EXPENSE, range.previous.from, range.previous.to)
        : 0,
    };
  }, [range, accounts, activities, user.startingDate]);

  const kpiValue = (id: Kpi) =>
    id === "balance" ? totals.balance : totals[id];

  const kpiPrevious = (id: Kpi) =>
    id === "balance"
      ? totals.balancePrevious
      : id === "revenue"
        ? totals.revenuePrevious
        : totals.expensePrevious;

  return (
    <div
      className="flex min-w-0 overflow-x-auto"
      role="group"
      aria-label="Range figures"
    >
      {kpiSpecs.map((kpi) => {
        const active = activeChart === kpi.id;
        const value = kpiValue(kpi.id);
        const previous = kpiPrevious(kpi.id);
        const delta = value - previous;
        const hasChange = value !== 0 || previous !== 0;
        const good = kpi.goodDirection === "up" ? delta >= 0 : delta <= 0;
        const percent = previous !== 0 ? (delta / previous) * 100 : null;

        return (
          <button
            key={kpi.id}
            type="button"
            aria-pressed={active}
            data-active={active}
            title="Switch the chart to this figure"
            className="flex min-w-36 flex-1 cursor-pointer flex-col gap-1 border-r px-4 py-3 text-left transition-colors duration-100 last:border-r-0 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset data-[active=true]:bg-muted/35 motion-reduce:transition-none"
            style={
              active ? { boxShadow: `inset 0 -2px 0 ${kpi.color}` } : undefined
            }
            onClick={() => onActiveChartChange(kpi.id)}
          >
            <span className="flex items-center gap-2">
              <kpi.icon
                className="size-3.5 shrink-0"
                style={{ color: kpi.color }}
              />
              <span className="font-mono text-xs leading-none tracking-[0.04em] uppercase opacity-70">
                {kpi.name}
              </span>
            </span>

            <span className="truncate font-mono text-lg leading-none font-semibold tabular-nums">
              <RollingAmount value={value} />
            </span>

            <span
              className={cn(
                "flex h-4 items-center gap-1 font-mono text-xs leading-none tabular-nums",
                !hasChange && "text-muted-foreground",
                hasChange && (good ? "text-primary" : "text-destructive"),
              )}
            >
              {hasChange ? (
                <>
                  {delta >= 0 ? (
                    <TrendingUp className="size-3 shrink-0" />
                  ) : (
                    <TrendingDown className="size-3 shrink-0" />
                  )}
                  {delta >= 0 ? "+" : "-"}
                  <RollingAmount value={Math.abs(delta)} />
                  {percent !== null && (
                    <span className="hidden whitespace-nowrap opacity-70 sm:inline">
                      ({percent >= 0 ? "+" : "-"}
                      {Math.abs(percent).toFixed(1)}%)
                    </span>
                  )}
                </>
              ) : (
                "—"
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
