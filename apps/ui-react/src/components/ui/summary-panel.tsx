import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SummaryPanelProps {
  open: boolean;
  /** Opens the closed rail; a panel that is always open never calls it. */
  onOpen?: () => void;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  width?: "md" | "lg";
}

/**
 * A page's summary panel, mounted either way: closed it is the narrow
 * rail reading "Summary" down its edge — the same component, expanded
 * by a width transition when opened, contracted when closed.
 */
export function SummaryPanel({
  open,
  onOpen,
  onClose,
  children,
  title = "Summary",
  actions,
  width = "md",
}: SummaryPanelProps) {
  return (
    <aside
      data-slot="summary-panel"
      aria-label={title}
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden border-l bg-card transition-[width] duration-200 ease-out motion-reduce:transition-none",
        open ? (width === "md" ? "md:w-[26rem]" : "md:w-[32rem]") : "w-9",
      )}
    >
      {open ? (
        <>
          <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={`Close ${title.toLowerCase()}`}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="font-serif text-xl leading-none font-normal tracking-[-0.01em]">
              {title}
            </div>
            {actions && (
              <div className="ml-auto flex items-center">{actions}</div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Show summary"
          className="flex min-h-0 flex-1 flex-col items-center pt-4 text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <span className="rotate-180 text-xs font-medium tracking-wide [writing-mode:vertical-rl]">
            {title}
          </span>
        </button>
      )}
    </aside>
  );
}
