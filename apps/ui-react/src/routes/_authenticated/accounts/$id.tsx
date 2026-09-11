import { type Account, AccountType } from "@maille/core/accounts";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowRightLeft,
  ChevronRight,
  House,
  Plus,
  ReceiptText,
  Settings,
  SquareChartGantt,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import z from "zod";

import { AccountLabel } from "@/components/accounts/account-label";
import { AccountSettingsDialog } from "@/components/accounts/account-settings-dialog";
import { AccountSummary } from "@/components/accounts/account-summary";
import { AccountTransactionsTable } from "@/components/accounts/account-transactions-table";
import { AddAssetModal } from "@/components/accounts/assets/add-asset-modal";
import { Asset } from "@/components/accounts/assets/asset";
import { AssetsTable } from "@/components/accounts/assets/assets-table";
import { CounterpartiesTable } from "@/components/accounts/counterparties/counterparties-table";
import { ShareAccountDialog } from "@/components/accounts/share-account-dialog";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { AddCounterpartyModal } from "@/components/counterparties/add-counterparty-modal";
import { AddMovementButton } from "@/components/movements/add-movement-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { MovementsTable } from "@/components/movements/movements-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/stores/accounts";
import { useFunds } from "@/stores/funds";
import { useMovements } from "@/stores/movements";

const ACCOUNT_TABS_NAMES = {
  movements: "Movements",
  assets: "Assets",
  counterparties: "Counterparties",
} as const;

const searchParamsSchema = z.object({
  tab: z
    .enum(["transactions", "movements", "assets", "counterparties"])
    .optional(),
  /** Filters the transactions by their fund on this account's side; "untracked" is Untracked. */
  fund: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/accounts/$id")({
  component: AccountPageRoute,
  validateSearch: searchParamsSchema,
  loader: async ({ params }) => {
    const accounts = useAccounts.getState().accounts;
    const account = accounts.find((a) => a.id === params.id);
    if (!account) {
      throw notFound();
    }

    return { account };
  },
});

function AccountPageRoute() {
  const accountId = Route.useParams().id;
  const account = useAccounts((state) => state.getAccountById(accountId));
  if (!account) {
    return <DeletedRedirect target={{ to: "/accounts" }} />;
  }

  return <AccountPage account={account} />;
}

function AccountPage({ account }: { account: Account }) {
  const accountId = account.id;
  const navigate = useNavigate();
  const { tab, fund } = Route.useSearch();
  const selectedTab = tab ?? "transactions";
  // The URL carries the fund id or the "untracked" sentinel; null is Untracked
  const fundFilter =
    fund === undefined ? undefined : fund === "untracked" ? null : fund;

  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);

  const movements = useMovements((state) => state.movements);
  const funds = useFunds((state) => state.funds);
  const filterFund =
    fundFilter != null
      ? (funds.find((f) => f.id === fundFilter) ?? null)
      : null;
  const setFundFilter = (value: string | null | undefined) =>
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        tab: "transactions",
        fund:
          value === undefined
            ? undefined
            : value === null
              ? "untracked"
              : value,
      }),
    });

  const viewMovements = movements.filter((m) => m.account === account.id);

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/accounts/$id",
    entries: [
      { key: "accounts", label: "Accounts", target: { to: "/accounts" } },
      ...(account
        ? [
            {
              key: `account:${account.id}`,
              label: <AccountLabel accountId={account.id} />,
              target: { to: "/accounts/$id", params: { id: account.id } },
            },
          ]
        : []),
      ...(account && selectedTab !== "transactions"
        ? [
            {
              key: `account-tab:${selectedTab}`,
              label: ACCOUNT_TABS_NAMES[selectedTab],
              target: {
                to: "/accounts/$id",
                params: { id: account.id },
                search: { tab: selectedTab },
              },
            },
          ]
        : []),
    ],
  });

  return (
    <>
      <SidebarInset className="flex-row">
        <div
          className={cn(
            "flex flex-1 flex-col",
            summaryOpen && "hidden md:flex",
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
            <SidebarTrigger className="mr-1" />

            <PageBreadcrumbs entries={breadcrumbs} />
            <div className="flex-1" />
            <SearchBar />
            {!summaryOpen && (
              <Button variant="secondary" onClick={() => setSummaryOpen(true)}>
                <SquareChartGantt />
                Summary
                <ChevronRight />
              </Button>
            )}
            <ShareAccountDialog account={account}>
              <Button
                variant={account.sharing.length > 0 ? "default" : "ghost"}
                size={account.sharing.length > 0 ? "default" : "icon"}
              >
                <Users />
                {account.sharing.length > 0 && "Shared"}
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
            onValueChange={(value) =>
              navigate({
                to: ".",
                search: (prev) => ({
                  ...prev,
                  tab: value as
                    | "transactions"
                    | "movements"
                    | "assets"
                    | "counterparties",
                }),
              })
            }
            className="min-h-0 flex-1"
          >
            <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 pr-4 pl-7">
              <TabsList className="ml-5">
                <TabsTrigger value="transactions">
                  <ReceiptText />
                  Transactions
                </TabsTrigger>
                {account.movements ? (
                  <TabsTrigger value="movements">
                    <ArrowRightLeft />
                    Movements
                  </TabsTrigger>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger value="movements" disabled>
                          <ArrowRightLeft />
                          Movements
                        </TabsTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Movements are not enabled for this account
                    </TooltipContent>
                  </Tooltip>
                )}
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

              {selectedTab === "transactions" && (
                <>
                  {fundFilter !== undefined && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setFundFilter(undefined)}
                    >
                      <div
                        className="size-3 shrink-0 rounded-sm"
                        style={
                          filterFund
                            ? { backgroundColor: filterFund.color }
                            : {
                                backgroundColor:
                                  "color-mix(in srgb, currentColor 40%, transparent)",
                              }
                        }
                      />
                      {filterFund ? filterFund.name : "Untracked"}
                      <X className="size-3.5" />
                    </Button>
                  )}
                  <AddActivityButton size="sm" />
                </>
              )}
              {selectedTab === "movements" && (
                <>
                  <FilterMovementsButton
                    viewId={`account-${account.id}-movements`}
                  />
                  <AddMovementButton size="sm" />
                </>
              )}
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

            <TabsContent value="transactions" className="flex h-full">
              <AccountTransactionsTable
                accountId={account.id}
                fundFilter={fundFilter}
              />
            </TabsContent>

            <TabsContent value="movements" className="flex h-full">
              <MovementsTable
                viewId={`account-${account.id}-movements`}
                movements={viewMovements}
                grouping="period"
                accountFilter={account.id}
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
        </div>

        <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
          <AccountSummary
            accountId={account.id}
            fundFilter={fundFilter}
            onFundFilter={setFundFilter}
          />
        </SummaryPanel>
      </SidebarInset>

      {selectedTab === "assets" && <Asset />}
    </>
  );
}
