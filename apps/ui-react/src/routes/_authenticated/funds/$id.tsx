import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ChevronRight,
  Settings,
  SquareChartGantt,
} from "lucide-react";
import { useState } from "react";

import { AllocateDialog } from "@/components/funds/allocate-dialog";
import { FundMovesTable } from "@/components/funds/fund-moves-table";
import { FundSettingsDialog } from "@/components/funds/fund-settings-dialog";
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
  const fund = useFunds((state) => state.getFundById(fundId));
  if (!fund) {
    throw notFound();
  }

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
                <BreadcrumbPage>
                  {fund.emoji && <span className="mr-1">{fund.emoji}</span>}
                  <span>{fund.name}</span>
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
          <AllocateDialog defaultToFund={fund.id}>
            <Button variant="outline">
              <ArrowDownToLine />
              Allocate
            </Button>
          </AllocateDialog>
          {!fund.isDefault && (
            <FundSettingsDialog fund={fund}>
              <Button variant="ghost" size="icon" aria-label="Fund settings">
                <Settings />
              </Button>
            </FundSettingsDialog>
          )}
        </header>

        <FundMovesTable fundId={fund.id} />
      </div>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
        <FundSummary fundId={fund.id} />
      </SummaryPanel>
    </SidebarInset>
  );
}
