import { differenceInCalendarDays } from "date-fns";
import { CalendarDays } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Allowed day differences between an item's date and the reference date. */
export type DateTolerance = 0 | 1 | 2;

const OPTIONS: { value: DateTolerance; label: string }[] = [
  { value: 0, label: "Exact" },
  { value: 1, label: "±1 day" },
  { value: 2, label: "±2 days" },
];

export const TOLERANCE_TEXT: Record<DateTolerance, string> = {
  0: "the same day",
  1: "at most 1 day apart",
  2: "at most 2 days apart",
};

/** True when `date` is at most `tolerance` calendar days away from `reference`. */
export function matchesDateTolerance(
  date: Date,
  reference: Date,
  tolerance: DateTolerance,
): boolean {
  return Math.abs(differenceInCalendarDays(date, reference)) <= tolerance;
}

interface LinkDateFilterProps {
  tolerance: DateTolerance | null;
  onChange: (tolerance: DateTolerance | null) => void;
  tooltip: React.ReactNode;
  className?: string;
}

/**
 * Date filter used by the link movement / link activity dialogs.
 * Configures how many days an item's date may differ from the
 * reference date. A null tolerance disables the filter.
 */
export function LinkDateFilter({
  tolerance,
  onChange,
  tooltip,
  className,
}: LinkDateFilterProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ButtonGroup className={className}>
          <Button
            variant="outline"
            size="icon-sm"
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none bg-muted/50 text-muted-foreground"
          >
            <CalendarDays />
          </Button>
          {OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={tolerance === option.value}
              onClick={() =>
                onChange(tolerance === option.value ? null : option.value)
              }
              className={
                tolerance === option.value
                  ? "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                  : "text-foreground/70"
              }
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
