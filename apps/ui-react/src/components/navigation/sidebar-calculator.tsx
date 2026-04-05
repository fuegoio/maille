import { Calculator as CalculatorIcon, X } from "lucide-react";
import * as React from "react";

import { Calculator, type CalculatorHandle } from "@/components/ui/calculator";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { Kbd, KbdGroup } from "../ui/kbd";

function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const calculatorRef = React.useRef<CalculatorHandle>(null);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    wrapperRef.current?.focus();
  }, []);

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={(e) => calculatorRef.current?.handleKeyDown(e)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        "mt-2 overflow-hidden rounded-md border border-border bg-sidebar transition-colors outline-none",
        focused && "border-ring ring-2 ring-ring/50",
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span
          className={cn(
            "text-xs font-medium text-muted-foreground transition-colors",
            focused && "text-foreground",
          )}
        >
          Calculator
        </span>
        <button
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close calculator"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Calculator ref={calculatorRef} />
    </div>
  );
}

interface SidebarCalculatorProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function SidebarCalculator({
  open,
  onToggle,
  onClose,
}: SidebarCalculatorProps) {
  return (
    <SidebarGroup className="px-0">
      <SidebarGroupContent>
        {!open && (
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                onClick={onToggle}
                tooltip="Calculator (⌘M)"
              >
                <CalculatorIcon />
                <span>Calculator</span>
                <div className="flex-1" />
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>M</Kbd>
                </KbdGroup>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {open && <CalculatorPanel onClose={onClose} />}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
