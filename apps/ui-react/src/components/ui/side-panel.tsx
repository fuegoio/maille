import {
  ChevronLeft,
  Maximize2,
  Minimize2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidePanelProps {
  title: string;
  icon?: LucideIcon;
  onClose: () => void;
  /**
   * Full view: the panel fills the content area instead of sitting beside
   * it. Only analytics opts in; undefined onToggleFullView hides the toggle.
   */
  fullView?: boolean;
  onToggleFullView?: () => void;
  width?: "md" | "lg";
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The right-hand panel shell shared by every panel type (filter, view
 * settings, analytics, summary). One panel per surface at a time; the
 * route decides which content to host.
 */
export function SidePanel({
  title,
  icon: Icon,
  onClose,
  fullView = false,
  onToggleFullView,
  width = "md",
  actions,
  children,
}: SidePanelProps) {
  return (
    <aside
      data-slot="side-panel"
      aria-label={title}
      className={cn(
        "flex h-full min-h-0 min-w-0 shrink-0 flex-col overflow-hidden border-l bg-card",
        fullView
          ? "w-full flex-1"
          : width === "md"
            ? "w-full md:w-[26rem]"
            : "w-full md:w-[32rem]",
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
        <div className="font-serif text-xl leading-none font-normal tracking-[-0.01em]">
          {title}
        </div>
        {actions && <div className="ml-auto flex items-center">{actions}</div>}
        {onToggleFullView && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFullView}
            aria-label={fullView ? "Collapse to panel" : "Expand to full view"}
            className={cn(actions ? undefined : "ml-auto")}
          >
            {fullView ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}
