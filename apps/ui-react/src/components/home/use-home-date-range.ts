import {
  differenceInCalendarDays,
  startOfDay,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { useMemo, useState } from "react";

export type HomeRangePreset =
  | "1m"
  | "3m"
  | "6m"
  | "ytd"
  | "1y"
  | "all"
  | "custom";

export const HOME_RANGE_PRESETS: { value: HomeRangePreset; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "ytd", label: "YTD" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

/**
 * A preset's window start, or null for "all" (the ledger's start) and
 * "custom" (wherever the picked window starts). Shared by the range hook
 * and the picker, which hides presets that would reach past the ledger's
 * start — with them every window clamps to the same no-op range.
 */
export function getPresetFrom(
  preset: HomeRangePreset,
  today: Date,
): Date | null {
  switch (preset) {
    case "1m":
      return startOfDay(subMonths(today, 1));
    case "3m":
      return startOfDay(subMonths(today, 3));
    case "6m":
      return startOfDay(subMonths(today, 6));
    case "ytd":
      return startOfYear(today);
    case "1y":
      return startOfDay(subYears(today, 1));
    default:
      return null;
  }
}

export interface HomeDateRange {
  preset: HomeRangePreset;
  from: Date;
  to: Date;
  /** The equivalent window just before the range; null when the ledger
   * starts inside the range, leaving nothing before it. */
  previous: { from: Date; to: Date } | null;
}

/**
 * The home page's date range: a preset window ending today, or a custom
 * window, always clamped to the ledger's starting date. The previous
 * window is the same length immediately before the range, for deltas.
 */
export function useHomeDateRange(startingDate: Date): {
  range: HomeDateRange;
  setPreset: (preset: HomeRangePreset) => void;
  setCustomRange: (from: Date, to: Date) => void;
} {
  const [preset, setPreset] = useState<HomeRangePreset>("3m");
  const [custom, setCustom] = useState<{ from: Date; to: Date } | null>(null);

  const range = useMemo<HomeDateRange>(() => {
    const today = startOfDay(new Date());
    const start = startOfDay(startingDate);

    let from: Date;
    let to: Date = today;
    if (preset === "custom") {
      if (!custom) {
        from = getPresetFrom("3m", today) ?? start;
      } else {
        let a = startOfDay(custom.from);
        let b = startOfDay(custom.to);
        if (a > b) [a, b] = [b, a];
        from = a < start ? start : a;
        to = b > today ? today : b;
      }
    } else {
      from = getPresetFrom(preset, today) ?? start;
    }

    if (from < start) from = start;
    if (to > today) to = today;

    // The window just before, of the same length, for period deltas.
    const length = differenceInCalendarDays(to, from) + 1;
    const previousTo = subDays(from, 1);
    let previous: { from: Date; to: Date } | null = null;
    if (previousTo >= start) {
      let previousFrom = subDays(from, length);
      if (previousFrom < start) previousFrom = start;
      previous = { from: previousFrom, to: previousTo };
    }

    return { preset, from, to, previous };
  }, [preset, custom, startingDate]);

  return {
    range,
    setPreset,
    setCustomRange: (from, to) => {
      setCustom({ from, to });
      setPreset("custom");
    },
  };
}
