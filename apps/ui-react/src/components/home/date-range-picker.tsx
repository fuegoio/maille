import { format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { type DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import {
  HOME_RANGE_PRESETS,
  getPresetFrom,
  type HomeDateRange,
  type HomeRangePreset,
} from "./use-home-date-range";

/**
 * The home page's range control: preset windows as a segmented control,
 * plus a calendar popover for any custom window. Both drive the KPIs
 * and the chart together. Presets that would reach back past the ledger's
 * start are hidden — their windows clamp to the same no-op range — and
 * the desktop-only hiding below sm keeps the top bar fitting on small
 * screens, where the calendar popover still reaches every window. On
 * mobile the segments grow to button height for touch and the popover
 * shows a single month so it fits the viewport.
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
  /** The calendar's selection, mirrored locally so a fresh pick can start
   * from any day — passing the active range as controlled `selected`
   * would make the first click complete a window against the old start. */
  const [selection, setSelection] = useState<DateRange | undefined>();
  const isCustom = range.preset === "custom";
  const isMobile = useIsMobile();

  const today = startOfDay(new Date());
  const presets = HOME_RANGE_PRESETS.filter((preset) => {
    const from = getPresetFrom(preset.value, today);
    return from === null || startingDate < from;
  });

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={isCustom ? "custom" : range.preset}
        aria-label="Chart date range"
        onValueChange={(value) => {
          // "custom" only opens the calendar; the preset switches once a
          // complete window is picked in it.
          if (value && value !== "custom") {
            onPreset(value as HomeRangePreset);
          }
        }}
      >
        {presets.map((preset) => (
          <ToggleGroupItem
            key={preset.value}
            value={preset.value}
            aria-label={`Range: ${preset.label}`}
            className={cn(
              "px-2.5 text-xs max-sm:h-9 max-sm:min-w-9 max-sm:px-3",
              (preset.value === "ytd" ||
                preset.value === "1y" ||
                preset.value === "all") &&
                "hidden sm:inline-flex",
            )}
          >
            {preset.label}
          </ToggleGroupItem>
        ))}

        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            // react-day-picker sets both ends on the first click (a
            // single-day window), so the popover stays open for a second
            // click to extend it; a pending selection applies on dismiss.
            // The calendar opens empty: prefilled, the first click would
            // move the old window's end instead of starting a fresh pick.
            if (!nextOpen && selection?.from && selection.to) {
              onCustomRange(selection.from, selection.to);
            }
            if (!nextOpen || !selection) setSelection(undefined);
            setOpen(nextOpen);
          }}
        >
          <PopoverTrigger asChild>
            <ToggleGroupItem
              value="custom"
              aria-label="Range: custom"
              className="gap-1.5 px-2.5 text-xs max-sm:h-9 max-sm:min-w-9"
            >
              {isCustom ? (
                <>
                  {format(range.from, "d MMM")} – {format(range.to, "d MMM")}
                </>
              ) : (
                <>
                  <CalendarIcon className="size-3.5" />
                  Custom
                </>
              )}
            </ToggleGroupItem>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="range"
              numberOfMonths={isMobile ? 1 : 2}
              defaultMonth={range.from}
              selected={selection}
              disabled={{ before: startingDate, after: today }}
              onSelect={(selected: DateRange | undefined) => {
                setSelection(selected);
                if (
                  selected?.from &&
                  selected.to &&
                  selected.from.getTime() < selected.to.getTime()
                ) {
                  onCustomRange(selected.from, selected.to);
                  setOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </ToggleGroup>
    </div>
  );
}
