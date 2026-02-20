import { ActivityType } from "@maille/core/activities";
import { format } from "date-fns";
import { useMemo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getCurrencyFormatter } from "@/lib/utils";
import { useAccounts } from "@/stores/accounts";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useWorkspaces } from "@/stores/workspaces";

import { SidebarInset } from "../ui/sidebar";

import { PeriodActivityCategoryLine } from "./period-activity-category-line";

interface PeriodActivitiesSummaryProps {
  periodDate: Date;
}

export function PeriodActivitiesSummary({
  periodDate,
}: PeriodActivitiesSummaryProps) {
  const categories = useActivities((state) => state.activityCategories);
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const currentWorkspace = useWorkspaces((state) => state.currentWorkspace);

  const viewFilters = {
    activityType: null,
    category: null,
    subcategory: null,
  };

  const getCategories = (activityType: ActivityType) => {
    return categories
      .filter((c) => c.type === activityType)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getProgressBarColor = (
    index: number,
    activityType: ActivityType,
  ): string => {
    const baseColors = {
      [ActivityType.REVENUE]: "#4ade80",
      [ActivityType.EXPENSE]: "#f87171",
      [ActivityType.INVESTMENT]: "#fb923c",
      [ActivityType.NEUTRAL]: "#9ca3af",
    };

    const color = baseColors[activityType];
    // Convert hex to RGB and adjust lightness
    const rgb = hexToRgb(color);
    if (rgb) {
      const { r, g, b } = rgb;
      const hsl = rgbToHsl(r, g, b);
      hsl.l =
        80 +
        (index / categories.filter((c) => c.type === activityType).length) *
          -50;
      return hslToHex(hsl);
    }
    return color;
  };

  const getActivityTypeTotalForMonth = (
    date: Date,
    activityType: ActivityType,
  ) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return activities
      .filter((a) => a.type === activityType)
      .filter((a) => a.date >= startOfMonth && a.date <= endOfMonth)
      .reduce((total, a) => total + a.amount, 0);
  };

  const getCategoryTotalForMonth = (date: Date, category: string) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return activities
      .filter((a) => a.category === category)
      .filter((a) => a.date >= startOfMonth && a.date <= endOfMonth)
      .reduce((total, a) => total + a.amount, 0);
  };

  const getBalanceForMonth = (date: Date): number => {
    // Calculate the balance for the previous month
    const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const previousBalance =
      previousMonth >= new Date(currentWorkspace!.startingDate)
        ? getBalanceForMonth(previousMonth)
        : accounts.reduce(
            (total, account) => total + (account.startingBalance ?? 0),
            0,
          );

    // Calculate revenue and expense for the current month
    const revenue = getActivityTypeTotalForMonth(date, ActivityType.REVENUE);
    const expense = getActivityTypeTotalForMonth(date, ActivityType.EXPENSE);

    // Compute the balance for the current month
    return previousBalance + revenue - expense;
  };

  const activityTypes = useMemo(
    () => [
      {
        type: ActivityType.REVENUE,
        value: getActivityTypeTotalForMonth(periodDate, ActivityType.REVENUE),
      },
      {
        type: ActivityType.EXPENSE,
        value: getActivityTypeTotalForMonth(periodDate, ActivityType.EXPENSE),
      },
      {
        type: ActivityType.INVESTMENT,
        value: getActivityTypeTotalForMonth(
          periodDate,
          ActivityType.INVESTMENT,
        ),
      },
      {
        type: ActivityType.NEUTRAL,
        value: getActivityTypeTotalForMonth(periodDate, ActivityType.NEUTRAL),
      },
    ],
    [],
  );

  return (
    <SidebarInset className="max-w-lg">
      <div className="flex w-full items-center border-b px-6 py-3">
        <div className="flex-1 font-semibold">
          {format(periodDate, "MMMM yyyy")}
        </div>
      </div>

      <div className="space-y-4">
        {activityTypes.map((activityType) => (
          <div key={activityType.type} className="w-full border-b px-3 py-3">
            <div
              className={`group flex h-9 cursor-pointer items-center justify-between rounded px-3 transition-colors ${
                viewFilters.activityType === activityType.type
                  ? "bg-primary-800"
                  : "hover:bg-primary-800"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={cn(
                    `mr-3 size-3 shrink-0 rounded`,
                    ACTIVITY_TYPES_COLOR[activityType.type],
                  )}
                />
                <span className="text-sm font-medium text-white">
                  {ACTIVITY_TYPES_NAME[activityType.type]}
                </span>
              </div>

              <div className="flex items-center">
                <div
                  className={`text-primary-200 mr-4 text-sm ${
                    viewFilters.activityType === activityType.type
                      ? ""
                      : "hidden group-hover:block"
                  }`}
                >
                  {viewFilters.activityType === activityType.type
                    ? "Clear filter"
                    : "Filter"}
                </div>

                <div className="text-right font-mono text-sm font-medium whitespace-nowrap text-white">
                  {getCurrencyFormatter().format(activityType.value)}
                </div>
              </div>
            </div>

            <div className="mt-1 mb-2 px-2">
              {activityType.value !== 0 && (
                <div className="bg-primary-800 flex h-2 w-full items-center overflow-hidden rounded-md transition-all hover:h-4">
                  {categories
                    .filter((c) => c.type === activityType.type)
                    .map((category, index) => {
                      const categoryValue = getCategoryTotalForMonth(
                        periodDate,
                        category.id,
                      );
                      const percentage =
                        (categoryValue / activityType.value) * 100;

                      return (
                        <Tooltip key={category.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="h-full transition-all hover:opacity-50"
                              style={{
                                backgroundColor: getProgressBarColor(
                                  index,
                                  activityType.type,
                                ),
                                width: `${percentage}%`,
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {category.name} (
                            {Math.round(percentage * 100) / 100}
                            %)
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                </div>
              )}
            </div>

            {getCategories(activityType.type).map((category) => (
              <PeriodActivityCategoryLine
                key={category.id}
                periodDate={periodDate}
                category={category}
              />
            ))}
          </div>
        ))}
      </div>
    </SidebarInset>
  );
}

// Helper functions for color manipulation
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

function hslToHex(hsl: { h: number; s: number; l: number }): string {
  const { h, s, l } = hsl;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return `#${Math.round(r * 255)
    .toString(16)
    .padStart(2, "0")}${Math.round(g * 255)
    .toString(16)
    .padStart(2, "0")}${Math.round(b * 255)
    .toString(16)
    .padStart(2, "0")}`;
}
