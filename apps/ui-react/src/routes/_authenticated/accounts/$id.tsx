import { type Account, AccountType } from "@maille/core/accounts";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { House, Plus, Settings, Users } from "lucide-react";
import { useState } from "react";
import z from "zod";

import { AccountLabel } from "@/components/accounts/account-label";
import { AccountSettingsDialog } from "@/components/accounts/account-settings-dialog";
import { AccountSummary } from "@/components/accounts/account-summary";
import { AddAssetModal } from "@/components/accounts/assets/add-asset-modal";
import { Asset } from "@/components/accounts/assets/asset";
import { AssetsTable } from "@/components/accounts/assets/assets-table";
import { CounterpartiesTable } from "@/components/accounts/counterparties/counterparties-table";
import { ShareAccountDialog } from "@/components/accounts/share-account-dialog";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { AddCounterpartyModal } from "@/components/counterparties/add-counterparty-modal";
import { AddMovementButton } from "@/components/movements/add-movement-button";
import { ExportMovementsButton } from "@/components/movements/export-movements-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { MovementsTable } from "@/components/movements/movements-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { TableViewSettingsButton } from "@/components/shared/table-view-settings-button";
import { ViewActions } from "@/components/shared/view-actions";
import { ExportTransactionsButton } from "@/components/transactions/export-transactions-button";
import { FilterTransactionsButton } from "@/components/transactions/filters/filter-transactions-button";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import { ViewSelect } from "@/components/views/view-select";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { MovementIcon, TransactionIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/stores/accounts";
import { useMovements } from "@/stores/movements";

const ACCOUNT_TABS_NAMES = {
  movements: "Movements",
  assets: "Assets",
  counterparties: "Counterparties",
} as const;

const searchParamsSchema = z.object({
  /** A fixed view, or a custom view's id. */
  view: z.string().optional(),
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
  const { view, fund } = Route.useSearch();
  const selectedTab = view ?? "transactions";
  // The URL carries the fund id or the "untracked" sentinel; null is Untracked
  const fundFilter =
    fund === undefined ? undefined : fund === "untracked" ? null : fund;

  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);

  const viewScope = { kind: "account", accountId: account.id } as const;
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const movements = useMovements((state) => state.movements);
  const setFundFilter = (value: string | null | undefined) =>
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        view: "transactions",
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
      ...(account &&
      selectedTab !== "transactions" &&
      selectedTab in ACCOUNT_TABS_NAMES
        ? [
            {
              key: `account-tab:${selectedTab}`,
              label:
                ACCOUNT_TABS_NAMES[
                  selectedTab as keyof typeof ACCOUNT_TABS_NAMES
                ],
              target: {
                to: "/accounts/$id",
                params: { id: account.id },
                search: { view: selectedTab },
              },
            },
          ]
        : []),
    ],
  });

  return (
    <>
      <SidebarInset className="@container flex-row">
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            summaryOpen && "hidden @min-[45rem]:flex",
          )}
        >
          <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
            <SidebarTrigger className="mr-1" />

            <PageBreadcrumbs entries={breadcrumbs} />
            <div className="flex-1" />
            <SearchBar />
            <ShareAccountDialog account={account}>
              <Button
                variant={account.sharing.length > 0 ? "default" : "ghost"}
                size={account.sharing.length > 0 ? "default" : "icon"}
                aria-label="Share account"
              >
                <Users />
                {account.sharing.length > 0 && (
                  <span className="hidden sm:inline">Shared</span>
                )}
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
                  view: value,
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
                    value: "transactions",
                    label: "Transactions",
                    icon: TransactionIcon,
                  },
                  {
                    value: "movements",
                    label: "Movements",
                    icon: MovementIcon,
                    disabled: !account.movements,
                  },
                  ...(account.type === AccountType.ASSETS
                    ? [{ value: "assets", label: "Assets", icon: House }]
                    : []),
                  ...(account.type === AccountType.LIABILITIES
                    ? [
                        {
                          value: "counterparties",
                          label: "Counterparties",
                          icon: Users,
                        },
                      ]
                    : []),
                ]}
              />
              <TabsList
                height="full"
                className="hidden min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 sm:flex [&_[data-slot=tabs-trigger]]:after:bottom-0"
              >
                <TabsTrigger value="transactions">
                  <TransactionIcon />
                  Transactions
                </TabsTrigger>
                {account.movements ? (
                  <TabsTrigger value="movements">
                    <MovementIcon />
                    Movements
                  </TabsTrigger>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <TabsTrigger value="movements" disabled>
                          <MovementIcon />
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

              {selectedCustomView !== null && (
                <>
                  {selectedCustomView.config.resource === "movements" && (
                    <AddMovementButton size="sm" />
                  )}
                  <CustomViewActions
                    view={selectedCustomView}
                    onConfigChange={(config) =>
                      updateViewConfig(selectedCustomView, config)
                    }
                    onDeleted={() =>
                      navigate({
                        to: ".",
                        search: (prev) => ({
                          ...prev,
                          view: "transactions",
                        }),
                      })
                    }
                  />
                </>
              )}

              {selectedCustomView === null &&
                selectedTab === "transactions" && (
                  <>
                    <AddActivityButton size="sm" />
                    <ViewActions>
                      <FilterTransactionsButton
                        viewId={`account-${account.id}-transactions`}
                      />
                      <TableViewSettingsButton
                        kind="transaction"
                        viewId={`account-${account.id}-transactions`}
                      />
                      <ExportTransactionsButton
                        filter={{
                          kind: "account",
                          accountId: account.id,
                          fundFilter,
                        }}
                        viewId={`account-${account.id}-transactions`}
                      />
                    </ViewActions>
                  </>
                )}
              {selectedCustomView === null && selectedTab === "movements" && (
                <>
                  <AddMovementButton size="sm" />
                  <ViewActions>
                    <FilterMovementsButton
                      viewId={`account-${account.id}-movements`}
                    />
                    <TableViewSettingsButton
                      kind="movement"
                      viewId={`account-${account.id}-movements`}
                    />
                    <ExportMovementsButton
                      movements={viewMovements}
                      viewId={`account-${account.id}-movements`}
                    />
                  </ViewActions>
                </>
              )}
              {selectedCustomView === null && selectedTab === "assets" && (
                <AddAssetModal accountId={accountId}>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Add asset"
                    className="w-7 px-0 sm:w-auto sm:px-2.5"
                  >
                    <Plus />
                    <span className="hidden sm:inline">Add asset</span>
                  </Button>
                </AddAssetModal>
              )}
              {selectedCustomView === null &&
                selectedTab === "counterparties" && (
                  <AddCounterpartyModal accountId={accountId}>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="Add counterparty"
                      className="w-7 px-0 sm:w-auto sm:px-2.5"
                    >
                      <Plus />
                      <span className="hidden sm:inline">Add counterparty</span>
                    </Button>
                  </AddCounterpartyModal>
                )}
            </header>

            <TabsContent value="transactions" className="flex h-full">
              <TransactionsTable
                viewId={`account-${account.id}-transactions`}
                filter={{
                  kind: "account",
                  accountId: account.id,
                  fundFilter,
                }}
              />
            </TabsContent>

            <TabsContent value="movements" className="flex h-full">
              <MovementsTable
                viewId={`account-${account.id}-movements`}
                movements={viewMovements}
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

            <CustomViewTabsContent scope={viewScope} />
          </Tabs>
        </div>

        <SummaryPanel
          open={summaryOpen}
          onOpen={() => setSummaryOpen(true)}
          onClose={() => setSummaryOpen(false)}
        >
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
