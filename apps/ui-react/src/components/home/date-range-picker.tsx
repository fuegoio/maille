import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import {
  HOME_RANGE_PRESETS,
  type HomeDateRange,
  type HomeRangePreset,
} from "./use-home-date-range";

/**
 * The home page's range control: preset windows as a segmented control,
 * plus a calendar popover for any custom window. Both drive the KPIs
 * and the chart together. Presets past 6M are desktop-only to fit the
 * top bar on small screens, where the calendar popover still reaches
 * every window.
 */
export function DateRangePicker({
  range,
  startingDate,
  onPreset,
  onCustomRange,
}: {
  range: HomeDateRange;
  startingDate: Date;
  onPreset: (preset: HomeRangePreset) => void;
  onCustomRange: (from: Date, to: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const isCustom = range.preset === "custom";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={isCustom ? "" : range.preset}
        aria-label="Chart date range"
        onValueChange={(value) => {
          if (value) onPreset(value as HomeRangePreset);
        }}
      >
        {HOME_RANGE_PRESETS.map((preset) => (
          <ToggleGroupItem
            key={preset.value}
            value={preset.value}
            aria-label={`Range: ${preset.label}`}
            className={cn(
              "px-2.5 text-xs",
              (preset.value === "ytd" ||
                preset.value === "1y" ||
                preset.value === "all") &&
                "hidden sm:inline-flex",
            )}
          >
            {preset.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={isCustom}
            className={cn(
              "h-7 shrink-0 gap-1.5 px-2.5 text-xs",
              isCustom && "bg-muted hover:bg-muted",
            )}
          >
            <CalendarIcon className="size-3.5" />
            {isCustom
              ? `${format(range.from, "d MMM")} – ${format(range.to, "d MMM")}`
              : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            numberOfMonths={2}
            month={range.from}
            defaultMonth={range.from}
            selected={{ from: range.from, to: range.to }}
            disabled={{ before: startingDate, after: new Date() }}
            onSelect={(selected: DateRange | undefined) => {
              if (selected?.from && selected.to) {
                onCustomRange(selected.from, selected.to);
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
