import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { FundMovesAnalytics } from "@/components/analytics/fund-moves-analytics";
import { FundMovesTable } from "@/components/funds/fund-moves-table";
import { FundSummary } from "@/components/funds/fund-summary";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import {
  SIDE_PANEL_ICONS,
  SIDE_PANEL_LABELS,
  SidePanelToggles,
} from "@/components/ui/panel-toggles";
import { SidePanel } from "@/components/ui/side-panel";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { usePanels } from "@/stores/panels";

export const Route = createFileRoute("/_authenticated/funds/untracked")({
  component: UntrackedFundPage,
});

/** Untracked is the default fund: every null side of a fund move. */
function UntrackedFundPage() {
  const isMobile = useIsMobile();
  const viewId = "fund-untracked";
  const defaultPanel = isMobile ? null : "summary";
  const panelState = usePanels((state) => state.getPanel(viewId, defaultPanel));
  const closePanel = usePanels((state) => state.closePanel);
  const setFullView = usePanels((state) => state.setFullView);
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
        target: { to: "/funds/untracked" },
      },
    ],
  });

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
        </header>

        <FundMovesTable fundId={null} accountFilter={accountFilter} />
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
              fundId={null}
              accountFilter={accountFilter ?? undefined}
              onAccountFilterChange={(account) =>
                setAccountFilter(account ?? null)
              }
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
              fundId={null}
              accountFilter={accountFilter}
              fullView={panelState.fullView}
            />
          )}
        </SidePanel>
      )}
    </SidebarInset>
  );
}
