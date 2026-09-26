import type { InvestmentPrice } from "@maille/core/accounts";

import { useHotkey } from "@tanstack/react-hotkeys";
import {
  Link,
  useNavigate,
  useRouter,
  useSearch,
} from "@tanstack/react-router";
import { format } from "date-fns";
import { ChartLine, Hash, Layers, Tag, Trash2 } from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { ActivityViewSettingsButton } from "@/components/activities/activity-view-settings-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import {
  DebouncedInput,
  DebouncedTextarea,
} from "@/components/shared/debounced-text-field";
import { TableViewSettingsButton } from "@/components/shared/table-view-settings-button";
import { ValuationTimeline } from "@/components/shared/valuation-timeline";
import { ViewActions } from "@/components/shared/view-actions";
import { ExportTransactionsButton } from "@/components/transactions/export-transactions-button";
import { FilterTransactionsButton } from "@/components/transactions/filters/filter-transactions-button";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RollingAmount } from "@/components/ui/rolling-amount";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGraphQLDate } from "@/lib/date";
import { ActivityIcon, TransactionIcon } from "@/lib/icons";
import {
  endOfToday,
  getInvestmentTotals,
  investmentQuantityAsOf,
  investmentTransactions,
  investmentValueAsOf,
} from "@/logic/investments";
import {
  addInvestmentPriceMutation,
  deleteInvestmentMutation,
  deleteInvestmentPriceMutation,
  updateInvestmentMutation,
  updateInvestmentPriceMutation,
} from "@/mutations/investments";
import { useActivities } from "@/stores/activities";
import { useInvestments } from "@/stores/investments";
import { useSync } from "@/stores/sync";

interface InvestmentPageProps {
  investmentId: string;
}

const sameDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export function InvestmentPage({ investmentId }: InvestmentPageProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const mutate = useSync((state) => state.mutate);

  const investment = useInvestments((state) =>
    state.getInvestmentById(investmentId),
  );
  const investments = useInvestments((state) => state.investments);
  const prices = useInvestments((state) => state.investmentPrices);
  const activities = useActivities((state) => state.activities);

  const { view } = useSearch({ from: "/_authenticated/investments/$id" });
  const selectedTab = view ?? "investment";
  const selectTab = (value: string) =>
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        view:
          value === "investment"
            ? undefined
            : (value as "activities" | "transactions"),
      }),
    });

  const breadcrumbs = usePageBreadcrumbs({
    contextual: true,
    routeKey: "/investments/$id",
    own: {
      key: `investment:${investmentId}`,
      label: investment?.name ?? "",
      title: investment?.name,
      target: { to: "/investments/$id", params: { id: investmentId } },
    },
    fallback: [
      {
        key: "accounts",
        label: "Accounts",
        target: { to: "/accounts" },
      },
      ...(investment
        ? [
            {
              key: `account:${investment.account}`,
              label: <AccountLabel accountId={investment.account} />,
              target: {
                to: "/accounts/$id",
                params: { id: investment.account },
              },
            },
            {
              key: "account-tab:investments",
              label: "Investments",
              target: {
                to: "/accounts/$id",
                params: { id: investment.account },
                search: { view: "investments" },
              },
            },
          ]
        : []),
    ],
  });

  // The position's facts read from two layers that never meet: the
  // units and the invested money derive from the ledger's transaction
  // legs, the value from the price series.
  const now = React.useMemo(() => new Date(endOfToday()), []);
  const investmentPriceList = React.useMemo(
    () =>
      prices
        .filter((price) => price.investment === investmentId)
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [prices, investmentId],
  );
  const lastPrice = investmentPriceList[0] ?? null;

  const quantity = investment
    ? investmentQuantityAsOf(investment, activities, now)
    : 0;
  const value = investment
    ? investmentValueAsOf(investment, activities, prices, now)
    : null;
  const totals = React.useMemo(
    () => getInvestmentTotals(activities, investmentId),
    [activities, investmentId],
  );

  const positionTransactions = React.useMemo(
    () => investmentTransactions(activities, investmentId),
    [activities, investmentId],
  );
  const positionActivities = React.useMemo(() => {
    const seen = new Set<string>();
    const result = [];
    for (const { activity } of positionTransactions) {
      if (seen.has(activity.id)) continue;
      seen.add(activity.id);
      result.push(activity);
    }
    return result;
  }, [positionTransactions]);

  const deleteInvestment = () => {
    if (!investment) return;
    mutate({
      name: "deleteInvestment",
      mutation: deleteInvestmentMutation,
      variables: { id: investment.id },
      rollbackData: { investment, prices: investmentPriceList },
      events: [
        {
          type: "deleteInvestment",
          payload: { id: investment.id },
        },
      ],
    });
    void router.navigate({
      to: "/accounts/$id",
      params: { id: investment.account },
      search: { view: "investments" },
    });
  };

  const handleUpdateInvestment = (update: {
    name?: string;
    symbol?: string | null;
    description?: string | null;
    initialQuantity?: number;
  }) => {
    if (!investment) return;
    mutate({
      name: "updateInvestment",
      mutation: updateInvestmentMutation,
      variables: { id: investment.id, ...update },
      rollbackData: { ...investment },
      events: [
        {
          type: "updateInvestment",
          payload: { id: investment.id, ...update },
        },
      ],
    });
  };

  const updatePrice = (pricePoint: InvestmentPrice, price: number) => {
    mutate({
      name: "updateInvestmentPrice",
      mutation: updateInvestmentPriceMutation,
      variables: { id: pricePoint.id, price },
      rollbackData: { ...pricePoint },
      events: [
        {
          type: "updateInvestmentPrice",
          payload: {
            id: pricePoint.id,
            investment: pricePoint.investment,
            price,
          },
        },
      ],
    });
  };

  const deletePrice = (pricePoint: InvestmentPrice) => {
    mutate({
      name: "deleteInvestmentPrice",
      mutation: deleteInvestmentPriceMutation,
      variables: { id: pricePoint.id },
      rollbackData: { ...pricePoint },
      events: [
        {
          type: "deleteInvestmentPrice",
          payload: {
            id: pricePoint.id,
            investment: pricePoint.investment,
          },
        },
      ],
    });
  };

  // Hotkeys to navigate between investments
  const sortedInvestments = React.useMemo(() => {
    return [...investments].sort((a, b) => a.name.localeCompare(b.name));
  }, [investments]);

  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    if (sortedInvestments.length === 0) return;

    const currentIndex = sortedInvestments.findIndex(
      (i) => i.id === investmentId,
    );
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex - 1 + sortedInvestments.length) %
          sortedInvestments.length;

    void router.navigate({
      to: "/investments/$id",
      params: { id: sortedInvestments[nextIndex].id },
      replace: true,
    });
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    if (sortedInvestments.length === 0) return;

    const currentIndex = sortedInvestments.findIndex(
      (i) => i.id === investmentId,
    );
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % sortedInvestments.length;

    void router.navigate({
      to: "/investments/$id",
      params: { id: sortedInvestments[nextIndex].id },
      replace: true,
    });
  });

  useHotkey("Escape", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (investment) {
      void router.navigate({
        to: "/accounts/$id",
        params: { id: investment.account },
        search: { view: "investments" },
      });
    } else {
      void router.navigate({ to: "/accounts" });
    }
  });

  if (!investment) return null;

  const viewId = `investment-${investment.id}-transactions`;
  const activitiesViewId = `investment-${investment.id}-activities`;

  return (
    <SidebarInset>
      <div className="flex h-full flex-col">
        <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="mr-1" />
          <PageBreadcrumbs entries={breadcrumbs} className="flex-1" />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete investment"
              >
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete investment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this investment and its{" "}
                  {investmentPriceList.length === 1
                    ? "price point"
                    : `${investmentPriceList.length} price points`}
                  ? The ledger's transactions stay: their investment legs are
                  cleared, the money rows remain. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteInvestment}
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>

        <Tabs
          value={selectedTab}
          onValueChange={selectTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <header className="@container flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
            <TabsList
              height="full"
              className="min-w-0 justify-start overflow-x-auto overflow-y-hidden [&_[data-slot=tabs-trigger]]:after:bottom-0"
            >
              <TabsTrigger value="investment">
                <ChartLine />
                Investment
              </TabsTrigger>
              <TabsTrigger value="activities">
                <ActivityIcon />
                Activities
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <TransactionIcon />
                Transactions
              </TabsTrigger>
            </TabsList>
            <div className="flex-1" />

            {selectedTab === "activities" && (
              <ViewActions>
                <FilterActivitiesButton viewId={activitiesViewId} />
                <ActivityViewSettingsButton viewId={activitiesViewId} />
                <ExportActivitiesButton
                  viewId={activitiesViewId}
                  activities={positionActivities}
                />
              </ViewActions>
            )}

            {selectedTab === "transactions" && (
              <>
                <AmountPairsValue
                  className="mr-2 text-sm"
                  pairs={[
                    { dot: "bg-green-400", amount: totals.in },
                    { dot: "bg-red-400", amount: -totals.out },
                  ]}
                />
                <ViewActions>
                  <FilterTransactionsButton viewId={viewId} />
                  <TableViewSettingsButton kind="transaction" viewId={viewId} />
                  <ExportTransactionsButton
                    filter={{
                      kind: "investment",
                      investmentId: investment.id,
                    }}
                    viewId={viewId}
                  />
                </ViewActions>
              </>
            )}
          </header>

          <TabsContent
            value="investment"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 overflow-y-auto pb-20">
              <div className="mx-auto w-full max-w-5xl">
                <div className="border-b px-4 py-6 sm:px-8">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" asChild className="h-6">
                      <Link
                        to="/accounts/$id"
                        params={{ id: investment.account }}
                        search={{ view: "investments" }}
                      >
                        <AccountLabel accountId={investment.account} />
                      </Link>
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between gap-4">
                    <DebouncedInput
                      key={investment.id}
                      aria-label="Investment name"
                      value={investment.name}
                      onCommit={(name) => handleUpdateInvestment({ name })}
                      placeholder="Investment name"
                      className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0.5 text-3xl font-semibold md:text-3xl dark:bg-transparent"
                    />
                    <div
                      className="shrink-0 font-mono text-2xl leading-snug font-semibold whitespace-nowrap tabular-nums"
                      title={lastPrice ? "Market value" : "No price yet"}
                    >
                      {value !== null ? (
                        <RollingAmount value={value} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 text-sm text-muted-foreground">
                    {lastPrice
                      ? `Market value as of ${format(lastPrice.date, "dd MMM yyyy")}`
                      : "Market value: add a first price below"}
                  </div>

                  <DebouncedTextarea
                    key={investment.id}
                    aria-label="Description"
                    value={investment.description || ""}
                    onCommit={(description) =>
                      handleUpdateInvestment({
                        description: description || null,
                      })
                    }
                    placeholder="Add a description ..."
                    rows={1}
                    className="mt-2 min-h-16 w-full resize-none border-0 bg-transparent px-0 py-0.5 text-sm dark:bg-transparent"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <label className="flex h-6 items-center gap-1.5 rounded-full border px-2.5">
                      <Hash className="size-3 shrink-0 text-muted-foreground" />
                      <DebouncedInput
                        key={investment.id}
                        aria-label="Symbol"
                        value={investment.symbol || ""}
                        onCommit={(symbol) =>
                          handleUpdateInvestment({ symbol: symbol || null })
                        }
                        placeholder="Add a symbol ..."
                        className="h-auto w-40 border-0 bg-transparent px-0 py-0 font-mono text-xs uppercase dark:bg-transparent"
                      />
                    </label>

                    <label className="flex h-6 items-center gap-1.5 rounded-full border px-2.5">
                      <Layers className="size-3 shrink-0 text-muted-foreground" />
                      <DebouncedInput
                        key={investment.id}
                        aria-label="Initial quantity"
                        value={String(investment.initialQuantity)}
                        onCommit={(initialQuantity) =>
                          handleUpdateInvestment({
                            initialQuantity:
                              initialQuantity === ""
                                ? 0
                                : Number(initialQuantity),
                          })
                        }
                        placeholder="Initial quantity"
                        className="h-auto w-24 border-0 bg-transparent px-0 py-0 text-xs dark:bg-transparent"
                      />
                      <span className="text-xs text-muted-foreground">
                        initial
                      </span>
                    </label>

                    <div className="flex h-6 items-center gap-1.5 rounded-full border px-2.5">
                      <Tag className="size-3 shrink-0 text-muted-foreground" />
                      <span className="font-mono text-xs">
                        {quantity} units
                      </span>
                      <span className="text-xs text-muted-foreground">
                        held
                      </span>
                    </div>
                  </div>
                </div>

                <UnitPriceSection
                  investmentId={investment.id}
                  prices={investmentPriceList}
                  onUpdatePrice={updatePrice}
                  onDeletePrice={deletePrice}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="activities"
            className="flex min-h-0 flex-1 flex-col"
          >
            <ActivitiesTable
              viewId={activitiesViewId}
              activities={positionActivities}
            />
          </TabsContent>

          <TabsContent
            value="transactions"
            className="flex min-h-0 flex-1 flex-col"
          >
            <TransactionsTable
              viewId={viewId}
              filter={{
                kind: "investment",
                investmentId: investment.id,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  );
}

interface UnitPriceSectionProps {
  investmentId: string;
  prices: InvestmentPrice[];
  onUpdatePrice: (pricePoint: InvestmentPrice, price: number) => void;
  onDeletePrice: (pricePoint: InvestmentPrice) => void;
}

/**
 * The position's price timeline: the shared valuation series with the
 * investment mutations wired in. One price per day.
 */
function UnitPriceSection({
  investmentId,
  prices,
  onUpdatePrice,
  onDeletePrice,
}: UnitPriceSectionProps) {
  const mutate = useSync((state) => state.mutate);

  const addPrice = (date: Date, price: number) => {
    // One price per day: a day that already has one is updated in
    // place, matching the server's upsert.
    const existing = prices.find((point) => sameDay(point.date, date));
    if (existing) {
      onUpdatePrice(existing, price);
      return;
    }

    const id = crypto.randomUUID();
    mutate({
      name: "addInvestmentPrice",
      mutation: addInvestmentPriceMutation,
      variables: {
        id,
        investment: investmentId,
        date: getGraphQLDate(date),
        price,
      },
      rollbackData: undefined,
      events: [
        {
          type: "addInvestmentPrice",
          payload: {
            id,
            investment: investmentId,
            date: date.toISOString(),
            price,
          },
        },
      ],
    });
  };

  return (
    <ValuationTimeline
      title="Unit price"
      description="Dated price observations. The latest one values the position; none of them ever touch the ledger."
      valueLabel="Unit price"
      emptyText="No price yet: the position's value appears with its first observation."
      points={prices.map(({ id, date, price: value }) => ({
        id,
        date,
        value,
      }))}
      onAdd={addPrice}
      onUpdateValue={(pointId, value) => {
        const point = prices.find((p) => p.id === pointId);
        if (point) onUpdatePrice(point, value);
      }}
      onDelete={(pointId) => {
        const point = prices.find((p) => p.id === pointId);
        if (point) onDeletePrice(point);
      }}
    />
  );
}
