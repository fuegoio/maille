import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { Period, PeriodActivityData } from "@/types/periods";

interface PeriodsState {
  getPeriodLabel: (period: Period) => "Completed" | "Current" | "Future";
  periodsAvailable: Period[];
  periodsActivityData: PeriodActivityData[];
  viewFilters: {
    category: string | null;
    subcategory: string | null;
    activityType: string | null;
  };
}

export const periodsStore = createStore<PeriodsState>()(
  persist(
    () => ({
      getPeriodLabel: (period: Period): "Completed" | "Current" | "Future" => {
        const now = new Date();
        const periodDate = new Date(period.year, period.month);

        if (periodDate < now) {
          return "Completed";
        } else if (period.year === now.getFullYear() && period.month === now.getMonth()) {
          return "Current";
        } else {
          return "Future";
        }
      },
      periodsAvailable: [],
      periodsActivityData: [],
      viewFilters: {
        category: null,
        subcategory: null,
        activityType: null,
      },
    }),
    {
      name: "periods",
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
  ),
);

// Custom hook to use the periods store
export function usePeriodsStore() {
  const state = periodsStore.getState();
  return {
    getPeriodLabel: state.getPeriodLabel,
    periodsAvailable: state.periodsAvailable,
    periodsActivityData: state.periodsActivityData,
    viewFilters: state.viewFilters,
  };
}
