import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SummaryPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  width?: "md" | "lg";
}

export function SummaryPanel({
  open,
  onClose,
  children,
  title = "Summary",
  actions,
  width = "md",
}: SummaryPanelProps) {
  if (!open) return null;

  return (
    <aside
      data-slot="summary-panel"
      aria-label={title}
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden border-l bg-card",
        width === "md" ? "md:w-[26rem]" : "md:w-[32rem]",
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
        <div className="font-serif text-xl leading-none font-normal tracking-[-0.01em]">
          {title}
        </div>
        {actions && <div className="ml-auto flex items-center">{actions}</div>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}
