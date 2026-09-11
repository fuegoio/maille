import { getFundAncestors } from "@maille/core/funds";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChevronRight, Plus, Settings, SquareChartGantt } from "lucide-react";
import { useMemo, useState } from "react";

import { CreateFundDialog } from "@/components/funds/create-fund-dialog";
import { FundMovesTable } from "@/components/funds/fund-moves-table";
import { FundSettingsDialog } from "@/components/funds/fund-settings-dialog";
import { FundSummary } from "@/components/funds/fund-summary";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useFunds } from "@/stores/funds";

export const Route = createFileRoute("/_authenticated/funds/$id")({
  component: FundPage,
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
            },
          ]
        : []),
    ],
  });

  if (!fund) {
    return <DeletedRedirect target={{ to: "/funds" }} />;
  }

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
          {!summaryOpen && (
            <Button variant="secondary" onClick={() => setSummaryOpen(true)}>
              <SquareChartGantt />
              Summary
              <ChevronRight />
            </Button>
          )}
          <CreateFundDialog defaultParent={fund.id}>
            <Button>
              <Plus />
              New subfund
            </Button>
          </CreateFundDialog>
          <FundSettingsDialog fund={fund}>
            <Button variant="ghost" size="icon" aria-label="Fund settings">
              <Settings />
            </Button>
          </FundSettingsDialog>
        </header>

        <FundMovesTable
          fundId={fund.id}
          accountFilter={accountFilter}
          subtree={subfundFilter !== "none"}
        />
      </div>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
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
