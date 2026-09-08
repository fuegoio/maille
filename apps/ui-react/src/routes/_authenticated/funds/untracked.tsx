import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, ChevronRight, SquareChartGantt } from "lucide-react";
import { useState } from "react";

import { AllocateDialog } from "@/components/funds/allocate-dialog";
import { FundMovesTable } from "@/components/funds/fund-moves-table";
import { FundSummary } from "@/components/funds/fund-summary";
import { SearchBar } from "@/components/search-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/funds">Funds</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center">
                  <span className="mr-1.5 inline-block size-3 rounded-sm bg-muted-foreground/40" />
                  <span className="text-muted-foreground">Untracked</span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
          <SearchBar />
          {!summaryOpen && (
            <Button variant="secondary" onClick={() => setSummaryOpen(true)}>
              <SquareChartGantt />
              Summary
              <ChevronRight />
            </Button>
          )}
          <AllocateDialog>
            <Button variant="outline">
              <ArrowDownToLine />
              Allocate
            </Button>
          </AllocateDialog>
        </header>

        <FundMovesTable fundId={null} />
      </div>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
        <FundSummary fundId={null} />
      </SummaryPanel>
    </SidebarInset>
  );
}
