import { getFundAncestors } from "@maille/core/funds";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

import { CreateFundDialog } from "@/components/funds/create-fund-dialog";
import { FundSettingsDialog } from "@/components/funds/fund-settings-dialog";
import { FundSummary } from "@/components/funds/fund-summary";
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
import { useFunds } from "@/stores/funds";

const searchParamsSchema = z.object({
  /** "transactions", or a custom view's id. */
  view: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/funds/$id")({
  component: FundPage,
  validateSearch: searchParamsSchema,
  loader: async ({ params }) => {
    const funds = useFunds.getState().funds;
    const fund = funds.find((f) => f.id === params.id);
    if (!fund) {
      throw notFound();
    }

    return { fund };
  },
});

function FundPage() {
  const fundId = Route.useParams().id;
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "transactions";
  const funds = useFunds((state) => state.funds);
  const fund = useFunds((state) => state.getFundById(fundId));
  // Derived in a memo, not in the selector: a fresh array per snapshot would
  // trip zustand's getSnapshot caching and re-render forever.
  const ancestors = useMemo(
    () => getFundAncestors(fundId, funds),
    [fundId, funds],
  );
  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  // "none" narrows the page to the fund's own money, excluding subfunds
  const [subfundFilter, setSubfundFilter] = useState<"none" | undefined>(
    undefined,
  );

  const viewScope = { kind: "fund", fundId } as const;
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/funds/$id",
    entries: [
      { key: "funds", label: "Funds", target: { to: "/funds" } },
      ...ancestors.map((ancestor) => ({
        key: `fund:${ancestor.id}`,
        label: (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-sm align-[-1px]"
              style={{ backgroundColor: ancestor.color }}
            />
            <span>{ancestor.name}</span>
          </span>
        ),
        title: ancestor.name,
        target: { to: "/funds/$id", params: { id: ancestor.id } },
      })),
      ...(fund
        ? [
            {
              key: `fund:${fund.id}`,
              label: (
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-3 rounded-sm align-[-1px]"
                    style={{ backgroundColor: fund.color }}
                  />
                  <span>{fund.name}</span>
                </span>
              ),
              title: fund.name,
              target: { to: "/funds/$id", params: { id: fund.id } },
            },
          ]
        : []),
    ],
  });

  if (!fund) {
    return <DeletedRedirect target={{ to: "/funds" }} />;
  }

  const transactionViewId = `fund-${fund.id}-transactions`;
  const transactionFilter = {
    kind: "fund",
    fundId: fund.id,
    subtree: subfundFilter !== "none",
    accountFilter,
  } as const;

  return (
    <SidebarInset className="flex-row">
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          summaryOpen && "hidden md:flex",
        )}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />

          <PageBreadcrumbs entries={breadcrumbs} />
          <div className="flex-1" />
          <SearchBar />
          <CreateFundDialog defaultParent={fund.id}>
            <Button
              variant="outline"
              aria-label="New subfund"
              className="w-8 px-0 sm:w-auto sm:px-2.5"
            >
              <Plus />
              <span className="hidden sm:inline">New subfund</span>
            </Button>
          </CreateFundDialog>
          <FundSettingsDialog fund={fund}>
            <Button variant="ghost" size="icon" aria-label="Fund settings">
              <Settings />
            </Button>
          </FundSettingsDialog>
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
                  <FilterTransactionsButton viewId={transactionViewId} />
                  <TableViewSettingsButton
                    kind="transaction"
                    viewId={transactionViewId}
                  />
                  <ExportTransactionsButton
                    filter={transactionFilter}
                    viewId={transactionViewId}
                  />
                </ViewActions>
              </>
            )}
          </header>

          <TabsContent value="transactions" className="flex h-full">
            <TransactionsTable
              viewId={transactionViewId}
              filter={transactionFilter}
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
          fundId={fund.id}
          accountFilter={accountFilter ?? undefined}
          onAccountFilterChange={(account) => setAccountFilter(account ?? null)}
          subfundFilter={subfundFilter}
          onSubfundFilterChange={setSubfundFilter}
        />
      </SummaryPanel>
    </SidebarInset>
  );
}
