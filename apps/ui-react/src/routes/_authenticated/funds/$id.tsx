import { getFundAncestors } from "@maille/core/funds";
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ChevronRight,
  Plus,
  Settings,
  SquareChartGantt,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";

import { AllocateDialog } from "@/components/funds/allocate-dialog";
import { CreateFundDialog } from "@/components/funds/create-fund-dialog";
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

// Only reachable when the fund disappears while its page is open (deleted
// from the settings dialog). Missing funds on direct URLs are handled by the
// loader's notFound.
function FundDeletedRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/funds" });
  }, [navigate]);
  return null;
}

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

  if (!fund) {
    return <FundDeletedRedirect />;
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

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/funds">Funds</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {ancestors.map((ancestor) => (
                <Fragment key={ancestor.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to="/funds/$id"
                        params={{ id: ancestor.id }}
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className="inline-block size-3 rounded-sm align-[-1px]"
                          style={{ backgroundColor: ancestor.color }}
                        />
                        <span>{ancestor.name}</span>
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </Fragment>
              ))}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <span
                    className="mr-1.5 inline-block size-3 rounded-sm align-[-1px]"
                    style={{ backgroundColor: fund.color }}
                  />
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

        <FundMovesTable fundId={fund.id} />
      </div>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
        <FundSummary fundId={fund.id} />
      </SummaryPanel>
    </SidebarInset>
  );
}
