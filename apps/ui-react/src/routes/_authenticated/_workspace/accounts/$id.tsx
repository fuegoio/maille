import { createFileRoute, notFound } from "@tanstack/react-router";
import { eachDayOfInterval } from "date-fns";
import { ArrowDown, ArrowRight, ArrowUp, Settings } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { AccountLabel } from "@/components/accounts/account-label";
import { AccountSettingsDialog } from "@/components/accounts/account-settings-dialog";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrencyFormatter } from "@/lib/utils";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";

export const Route = createFileRoute("/_authenticated/_workspace/accounts/$id")(
  {
    component: AccountPage,
    loader: async ({ params }) => {
      const accounts = useAccounts.getState().accounts;
      const account = accounts.find((a) => a.id === params.id);
      if (!account) {
        throw notFound();
      }

      return { account };
    },
  },
);

type Kpi = "balance" | "in" | "out";

function AccountPage() {
  const accountId = Route.useParams().id;
  const account = useAccounts((state) => state.getAccountById(accountId));
  if (!account) {
    throw notFound();
  }

  const { workspace } = Route.useRouteContext();
  const activities = useActivities((state) => state.activities);

  const [activeChart, setActiveChart] = useState<Kpi>("balance");

  const currencyFormatter = getCurrencyFormatter();

  const viewActivities = activities.filter((a) => {
    return a.transactions.some(
      (t) => t.fromAccount === account.id || t.toAccount === account.id,
    );
  });

  const getAccountTotal = ({
    date,
    flow,
  }: {
    date?: string;
    flow?: "in" | "out";
  }) => {
    const transactionsTotal = activities
      .filter((a) => (date ? a.date <= new Date(date) : true))
      .flatMap((a) => a.transactions)
      .filter(
        (t) =>
          ((flow === "in" || flow === undefined) &&
            t.fromAccount === account.id) ||
          ((flow === "out" || flow === undefined) &&
            t.toAccount === account.id),
      )
      .reduce((acc, t) => {
        if (t.fromAccount === account.id) {
          return acc - t.amount;
        } else {
          return acc + t.amount;
        }
      }, 0);

    return (account.startingBalance ?? 0) + transactionsTotal;
  };

  const days = eachDayOfInterval({
    start: workspace.startingDate,
    end: new Date(),
  });

  const chartData = days.map((date) => {
    return {
      date: date.toISOString(),
      value: getAccountTotal({
        date: date.toISOString(),
        flow: activeChart === "balance" ? undefined : activeChart,
      }),
    };
  });

  const chartConfig = {
    views: {
      label: activeChart,
    },
    value: {
      label: activeChart,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />
          <AccountLabel accountId={account.id} />
          <div className="flex-1" />
          <AccountSettingsDialog account={account}>
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </AccountSettingsDialog>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="m-4 rounded-lg border">
            <div className="grid grid-cols-4 border-b">
              {(
                [
                  {
                    id: "balance",
                    name: "Balance",
                    icon: ArrowRight,
                    value: getAccountTotal({}),
                  },
                  {
                    id: "in",
                    name: "In",
                    icon: ArrowDown,
                    value: getAccountTotal({ flow: "in" }),
                  },
                  {
                    id: "out",
                    name: "Out",
                    icon: ArrowUp,
                    value: getAccountTotal({ flow: "out" }),
                  },
                ] as const
              ).map((kpi) => {
                return (
                  <button
                    key={kpi.name}
                    data-active={activeChart === kpi.id}
                    className="flex flex-1 cursor-pointer flex-col justify-center gap-1 border-r px-6 py-8
                text-left transition-colors last:border-r-0 hover:bg-muted/50 data-[active=true]:bg-muted/40"
                    onClick={() => setActiveChart(kpi.id)}
                  >
                    <div className="flex items-center text-xs text-muted-foreground">
                      <kpi.icon className="mr-2 size-4" />
                      {kpi.name}
                    </div>
                    <span className="font-mono text-lg leading-none font-semibold sm:text-3xl">
                      {currencyFormatter.format(kpi.value)}
                    </span>
                  </button>
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
            viewId={`account-${account.id}`}
            activities={viewActivities}
            grouping="period"
          />
        </div>
      </SidebarInset>

      <Activity />
    </>
  );
}
