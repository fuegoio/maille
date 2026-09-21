import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";

import { FundSummary } from "@/components/funds/fund-summary";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { TableViewSettingsButton } from "@/components/shared/table-view-settings-button";
import { ViewActions } from "@/components/shared/view-actions";
import { ExportTransactionsButton } from "@/components/transactions/export-transactions-button";
import { FilterTransactionsButton } from "@/components/transactions/filters/filter-transactions-button";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import { ViewSelect } from "@/components/views/view-select";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { TransactionIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const searchParamsSchema = z.object({
  /** "transactions", or a custom view's id. */
  view: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/funds/untracked")({
  component: UntrackedFundPage,
  validateSearch: searchParamsSchema,
});

/** Untracked is the default fund: every null side of a fund move. */
function UntrackedFundPage() {
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "transactions";
  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

  const viewScope = { kind: "fund", fundId: null } as const;
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/funds/untracked",
    entries: [
      { key: "funds", label: "Funds", target: { to: "/funds" } },
      {
        key: "untracked",
        label: (
          <span className="flex items-center">
            <span className="mr-1.5 inline-block size-3 rounded-sm bg-muted-foreground/40" />
            <span className="text-muted-foreground">Untracked</span>
          </span>
        ),
        target: { to: "/funds/untracked" },
      },
    ],
  });

  return (
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
        </header>

        <Tabs
          value={selectedTab}
          onValueChange={(value) =>
            navigate({
              to: ".",
              search: (prev) => ({
                ...prev,
                view: value === "transactions" ? undefined : value,
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
            {selectedCustomView !== null ? (
              <CustomViewActions
                view={selectedCustomView}
                onConfigChange={(config) =>
                  updateViewConfig(selectedCustomView, config)
                }
                onDeleted={() =>
                  navigate({
                    to: ".",
                    search: (prev) => ({ ...prev, view: undefined }),
                  })
                }
              />
            ) : (
              <>
                <ViewActions>
                  <FilterTransactionsButton viewId="fund-untracked-transactions" />
                  <TableViewSettingsButton
                    kind="transaction"
                    viewId="fund-untracked-transactions"
                  />
                  <ExportTransactionsButton
                    filter={{
                      kind: "fund",
                      fundId: null,
                      accountFilter,
                    }}
                    viewId="fund-untracked-transactions"
                  />
                </ViewActions>
              </>
            )}
          </header>

          <TabsContent value="transactions" className="flex h-full">
            <TransactionsTable
              viewId="fund-untracked-transactions"
              filter={{
                kind: "fund",
                fundId: null,
                accountFilter,
              }}
            />
          </TabsContent>

          <CustomViewTabsContent scope={viewScope} />
        </Tabs>
      </div>

      <SummaryPanel
        open={summaryOpen}
        onOpen={() => setSummaryOpen(true)}
        onClose={() => setSummaryOpen(false)}
      >
        <FundSummary
          fundId={null}
          accountFilter={accountFilter ?? undefined}
          onAccountFilterChange={(account) => setAccountFilter(account ?? null)}
        />
      </SummaryPanel>
    </SidebarInset>
  );
}
