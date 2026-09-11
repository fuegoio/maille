import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, SquareChartGantt } from "lucide-react";
import { useState } from "react";

import { FundMovesTable } from "@/components/funds/fund-moves-table";
import { FundSummary } from "@/components/funds/fund-summary";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/funds/untracked")({
  component: UntrackedFundPage,
});

/** Untracked is the default fund: every null side of a fund move. */
function UntrackedFundPage() {
  const isMobile = useIsMobile();
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);

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
      },
    ],
  });

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
        </header>

        <FundMovesTable fundId={null} accountFilter={accountFilter} />
      </div>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
        <FundSummary
          fundId={null}
          accountFilter={accountFilter ?? undefined}
          onAccountFilterChange={(account) => setAccountFilter(account ?? null)}
        />
      </SummaryPanel>
    </SidebarInset>
  );
}
