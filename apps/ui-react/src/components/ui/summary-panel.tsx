import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SummaryPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SummaryPanel({ open, onClose, children }: SummaryPanelProps) {
  if (!open) return null;

  return (
    <div className="h-full w-full overflow-y-auto rounded-tr-xl border-l bg-popover md:max-w-md">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-sm font-medium">Summary</div>
      </div>

      {children}
    </div>
  );
}
