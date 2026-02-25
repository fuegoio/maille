import { AccountType } from "@maille/core/accounts";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { eachDayOfInterval, startOfDay } from "date-fns";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookMarked,
  House,
  LayoutDashboard,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { AccountLabel } from "@/components/accounts/account-label";
import { AccountSettingsDialog } from "@/components/accounts/account-settings-dialog";
import { ShareAccountDialog } from "@/components/accounts/share-account-dialog";
import { AddAssetModal } from "@/components/accounts/assets/add-asset-modal";
import { Asset } from "@/components/accounts/assets/asset";
import { AssetsTable } from "@/components/accounts/assets/assets-table";
import { AddCounterpartyModal } from "@/components/accounts/counterparties/add-counterparty-modal";
import { CounterpartiesTable } from "@/components/accounts/counterparties/counterparties-table";
import { Counterparty } from "@/components/accounts/counterparties/counterparty";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { Activity } from "@/components/activities/activity";
import { AddActivityButton } from "@/components/activities/add-activity-button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/_authenticated/accounts/$id")({
  component: AccountPage,
  loader: async ({ params }) => {
    const accounts = useAccounts.getState().accounts;
    const account = accounts.find((a) => a.id === params.id);
    if (!account) {
      throw notFound();
    }

    return { account };
  },
});

type Kpi = "balance" | "in" | "out";

function AccountPage() {
  const accountId = Route.useParams().id;
  const account = useAccounts((state) => state.getAccountById(accountId));
  if (!account) {
    throw notFound();
  }

  const [activeChart, setActiveChart] = useState<Kpi>("balance");
  const [selectedTab, setSelectedTab] = useState("summary");
  const user = useAuth((state) => state.user!);
  const activities = useActivities((state) => state.activities);

  const currencyFormatter = useCurrencyFormatter();

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
      .filter((a) =>
        date ? startOfDay(a.date) <= startOfDay(new Date(date)) : true,
      )
      .flatMap((a) => a.transactions)
      .filter(
        (t) =>
          ((flow === "in" || flow === undefined) &&
            t.toAccount === account.id) ||
          ((flow === "out" || flow === undefined) &&
            t.fromAccount === account.id),
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
    start: user.startingDate,
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
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/accounts">Accounts</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <AccountLabel accountId={account.id} />
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
          <ShareAccountDialog accountId={account.id}>
            <Button variant="ghost" size="icon">
              <Users />
            </Button>
          </ShareAccountDialog>
          <AccountSettingsDialog account={account}>
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </AccountSettingsDialog>
        </header>

        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="h-full"
        >
          <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 pr-4 pl-7">
            <TabsList className="ml-5">
              <TabsTrigger value="summary">
                <LayoutDashboard />
                Summary
              </TabsTrigger>
              <TabsTrigger value="activities">
                <BookMarked />
                Activities
              </TabsTrigger>
              {account.type === AccountType.ASSETS && (
                <TabsTrigger value="assets">
                  <House />
                  Assets
                </TabsTrigger>
              )}
              {account.type === AccountType.LIABILITIES && (
                <TabsTrigger value="counterparties">
                  <Users />
                  Counterparties
                </TabsTrigger>
              )}
            </TabsList>
            <div className="flex-1" />
            {selectedTab === "activities" && <AddActivityButton size="sm" />}
            {selectedTab === "assets" && (
              <AddAssetModal accountId={accountId}>
                <Button size="sm">
                  <Plus />
                  Add asset
                </Button>
              </AddAssetModal>
            )}
            {selectedTab === "counterparties" && (
              <AddCounterpartyModal accountId={accountId}>
                <Button size="sm">
                  <Plus />
                  Add counterparty
                </Button>
              </AddCounterpartyModal>
            )}
          </header>

          <TabsContent value="summary">
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
              className="aspect-auto h-[250px] w-full border-b py-4"
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
          </TabsContent>

          <TabsContent value="activities" className="flex h-full">
            <ActivitiesTable
              viewId={`account-${account.id}`}
              activities={viewActivities}
              grouping="period"
            />
          </TabsContent>

          {account.type === AccountType.ASSETS && (
            <TabsContent value="assets" className="flex h-full">
              <AssetsTable accountId={account.id} />
            </TabsContent>
          )}

          {account.type === AccountType.LIABILITIES && (
            <TabsContent value="counterparties" className="flex h-full">
              <CounterpartiesTable accountId={account.id} />
            </TabsContent>
          )}
        </Tabs>
      </SidebarInset>

      {selectedTab === "activities" && <Activity />}
      {selectedTab === "assets" && <Asset />}
      {selectedTab === "counterparties" && <Counterparty />}
    </>
  );
}
