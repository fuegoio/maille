import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "./storage";

export type AnalyticsChartKind = "bar" | "line";

export type AnalyticsConfig = {
  /** The Y metric key, one of the surface's metrics. */
  y: string;
  /** The X bucket key: a date granularity or a dimension. */
  x: string;
  /** The series dimension key, or "none" for a single series. */
  groupBy: string;
  chart: AnalyticsChartKind;
};

interface AnalyticsState {
  configs: Record<string, AnalyticsConfig>;

  /** The view's chart configuration, or the surface's defaults. */
  getConfig: (viewId: string, defaults: AnalyticsConfig) => AnalyticsConfig;
  setConfig: (viewId: string, config: AnalyticsConfig) => void;
}

// Stable references per defaults: selectors returning these must hit
// referential equality across renders, or zustand re-renders forever.
const DEFAULT_CONFIGS = new Map<string, AnalyticsConfig>();

function defaultConfig(config: AnalyticsConfig): AnalyticsConfig {
  const key = JSON.stringify(config);
  let stored = DEFAULT_CONFIGS.get(key);
  if (!stored) {
    stored = config;
    DEFAULT_CONFIGS.set(key, stored);
  }
  return stored;
}

export const useAnalytics = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      configs: {},

      getConfig: (viewId, defaults) => {
        return get().configs[viewId] ?? defaultConfig(defaults);
      },

      setConfig: (viewId, config) => {
        set((state) => ({
          configs: {
            ...state.configs,
            [viewId]: config,
          },
        }));
      },
    }),
    {
      name: "analytics",
      storage: storage,
    },
  ),
);
