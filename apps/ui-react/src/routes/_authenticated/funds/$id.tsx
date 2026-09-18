import { getFundAncestors } from "@maille/core/funds";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Plus, Settings } from "lucide-react";
import { useMemo, useState } from "react";

import { FundMovesAnalytics } from "@/components/analytics/fund-moves-analytics";
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
import {
  SIDE_PANEL_ICONS,
  SIDE_PANEL_LABELS,
  SidePanelToggles,
} from "@/components/ui/panel-toggles";
import { SidePanel } from "@/components/ui/side-panel";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useFunds } from "@/stores/funds";
import { usePanels } from "@/stores/panels";

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
  const viewId = `fund-${fundId}`;
  const defaultPanel = isMobile ? null : "summary";
  const panelState = usePanels((state) => state.getPanel(viewId, defaultPanel));
  const closePanel = usePanels((state) => state.closePanel);
  const setFullView = usePanels((state) => state.setFullView);
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
              target: { to: "/funds/$id", params: { id: fund.id } },
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
          panelState.panel !== null &&
            (isMobile || panelState.fullView) &&
            "hidden",
        )}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />

          <PageBreadcrumbs entries={breadcrumbs} />
          <div className="flex-1" />
          <SearchBar />
          <SidePanelToggles
            viewId={viewId}
            panels={["analytics", "summary"]}
            defaultPanel={defaultPanel}
          />
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

        <FundMovesTable
          fundId={fund.id}
          accountFilter={accountFilter}
          subtree={subfundFilter !== "none"}
        />
      </div>

      {panelState.panel !== null && (
        <SidePanel
          title={
            panelState.panel ? SIDE_PANEL_LABELS[panelState.panel] : "Panel"
          }
          icon={
            panelState.panel ? SIDE_PANEL_ICONS[panelState.panel] : undefined
          }
          onClose={() => closePanel(viewId)}
          fullView={panelState.fullView && panelState.panel === "analytics"}
          onToggleFullView={
            panelState.panel === "analytics"
              ? () => setFullView(viewId, !panelState.fullView)
              : undefined
          }
          scrollable={panelState.panel !== "analytics"}
        >
          {panelState.panel === "summary" && (
            <FundSummary
              fundId={fund.id}
              accountFilter={accountFilter ?? undefined}
              onAccountFilterChange={(account) =>
                setAccountFilter(account ?? null)
              }
              subfundFilter={subfundFilter}
              onSubfundFilterChange={setSubfundFilter}
            />
          )}

          {panelState.panel === "analytics" && (
            <FundMovesAnalytics
              viewId="funds-moves"
              defaults={{
                y: "net",
                x: "month",
                groupBy: "counterpartFund",
                chart: "bar",
              }}
              fundId={fund.id}
              subtree={subfundFilter !== "none"}
              accountFilter={accountFilter}
              fullView={panelState.fullView}
            />
          )}
        </SidePanel>
      )}
    </SidebarInset>
  );
}
