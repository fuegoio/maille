import { useMemo } from "react";
import { useActivitiesStore } from "@/stores/activities";
import { usePeriodsStore } from "@/stores/periods";
import { PeriodActivityCategoryLine } from "./period-activity-category-line";
import { getCurrencyFormatter } from "@/utils/currency";
import { ActivityType } from "@maille/core/activities";
import type { PeriodActivityData } from "@/types/periods";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

// Color mapping for activity types
const ACTIVITY_TYPES_COLOR: Record<ActivityType, string> = {
  [ActivityType.REVENUE]: "green",
  [ActivityType.EXPENSE]: "red",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "gray",
};

const ACTIVITY_TYPES_NAME: Record<ActivityType, string> = {
  [ActivityType.REVENUE]: "Revenue",
  [ActivityType.EXPENSE]: "Expense",
  [ActivityType.INVESTMENT]: "Investment",
  [ActivityType.NEUTRAL]: "Neutral",
};

interface PeriodActivitiesSummaryProps {
  periodDate: Date;
}

export function PeriodActivitiesSummary({ periodDate }: PeriodActivitiesSummaryProps) {
  const { categories } = useActivitiesStore();
  const { viewFilters, periodsActivityData } = usePeriodsStore();

  const periodActivityData = useMemo<PeriodActivityData>(() => {
    return periodsActivityData.find(
      (p) => 
        p.month === periodDate.getMonth() && 
        p.year === periodDate.getFullYear()
    )!;
  }, [periodsActivityData, periodDate]);

  const getCategories = (activityType: ActivityType) => {
    return categories
      .filter((c) => c.type === activityType)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const selectActivityTypeToFilterActivities = (activityType: ActivityType) => {
    viewFilters.category = null;
    viewFilters.subcategory = null;
    if (viewFilters.activityType !== activityType) {
      viewFilters.activityType = activityType;
    } else {
      viewFilters.activityType = null;
    }
  };

  const getProgressBarColor = (index: number, activityType: ActivityType): string => {
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
      hsl.l = 80 + (index / categories.filter((c) => c.type === activityType).length) * -50;
      return hslToHex(hsl);
    }
    return color;
  };

  const activityTypes = useMemo(() => [
    {
      type: ActivityType.REVENUE,
      value: periodActivityData.revenue,
    },
    {
      type: ActivityType.EXPENSE,
      value: periodActivityData.expense,
    },
    {
      type: ActivityType.INVESTMENT,
      value: periodActivityData.investment,
    },
  ], [periodActivityData]);

  return (
    <div className="space-y-4">
      {activityTypes.map((activityType) => (
        <div key={activityType.type} className="border-b py-3 px-3 w-full">
          <div
            className={`flex items-center justify-between px-3 rounded group h-9 transition-colors cursor-pointer ${
              viewFilters.activityType === activityType.type
                ? 'bg-primary-800'
                : 'hover:bg-primary-800'
            }`}
            onClick={() => selectActivityTypeToFilterActivities(activityType.type)}
          >
            <div className="flex items-center">
              <div
                className={`size-3 rounded shrink-0 mr-3 bg-${ACTIVITY_TYPES_COLOR[activityType.type]}-300`}
              />
              <span className="text-sm text-white font-medium">
                {ACTIVITY_TYPES_NAME[activityType.type]}
              </span>
            </div>

            <div className="flex items-center">
              <div
                className={`mr-4 text-primary-200 text-sm ${
                  viewFilters.activityType === activityType.type
                    ? ''
                    : 'hidden group-hover:block'
                }`}
              >
                {viewFilters.activityType === activityType.type ? 'Clear filter' : 'Filter'}
              </div>

              <div className="whitespace-nowrap text-right text-white text-sm font-medium font-mono">
                {getCurrencyFormatter().format(activityType.value)}
              </div>
            </div>
          </div>

          <div className="px-2 mt-1 mb-2">
            {activityType.value !== 0 && (
              <div className="w-full h-2 hover:h-4 transition-all rounded-md flex items-center overflow-hidden bg-primary-800">
                {categories
                  .filter((c) => c.type === activityType.type)
                  .map((category, index) => {
                    const categoryValue = periodActivityData.categories.find(
                      (c) => c.category === category.id
                    )?.value ?? 0;
                    const percentage = (categoryValue / activityType.value) * 100;
                    
                    return (
                      <Tooltip key={category.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-full transition-all hover:opacity-50"
                            style={{
                              backgroundColor: getProgressBarColor(index, activityType.type),
                              width: `${percentage}%`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {category.name} ({Math.round(percentage * 100) / 100}%)
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

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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

  return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
}