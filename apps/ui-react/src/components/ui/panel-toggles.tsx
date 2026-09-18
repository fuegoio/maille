import {
  ChartColumn,
  ListFilter,
  SlidersHorizontal,
  SquareChartGantt,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePanels, type SidePanelKind } from "@/stores/panels";

/** The cluster's fixed icon and label per panel, in display order. */
export const SIDE_PANEL_ICONS: Record<SidePanelKind, LucideIcon> = {
  filter: ListFilter,
  settings: SlidersHorizontal,
  analytics: ChartColumn,
  summary: SquareChartGantt,
};

export const SIDE_PANEL_LABELS: Record<SidePanelKind, string> = {
  filter: "Filter",
  settings: "View settings",
  analytics: "Analytics",
  summary: "Summary",
};

interface SidePanelTogglesProps {
  /** The view the panels are scoped to — one drawer state per view. */
  viewId: string;
  /** The panels this surface offers, in cluster order. */
  panels: SidePanelKind[];
  /** The panel a view opens with before anything is stored. */
  defaultPanel?: SidePanelKind | null;
  className?: string;
}

/**
 * The small icon-button cluster toggling the surface's side panels, like
 * Linear's filter / display / insights / details toggles. Clicking the
 * active panel's icon closes it.
 */
export function SidePanelToggles({
  viewId,
  panels,
  defaultPanel = null,
  className,
}: SidePanelTogglesProps) {
  const panelState = usePanels((state) => state.getPanel(viewId, defaultPanel));
  const togglePanel = usePanels((state) => state.togglePanel);

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="group"
      aria-label="Side panels"
    >
      {panels.map((kind) => {
        const Icon = SIDE_PANEL_ICONS[kind];
        const active = panelState.panel === kind;

        return (
          <Tooltip key={kind}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-pressed={active}
                aria-label={
                  active
                    ? `${SIDE_PANEL_LABELS[kind]} panel, close`
                    : `${SIDE_PANEL_LABELS[kind]} panel`
                }
                onClick={() => togglePanel(viewId, kind, defaultPanel)}
                className={cn(active && "bg-muted hover:bg-muted")}
              >
                <Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{SIDE_PANEL_LABELS[kind]}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
