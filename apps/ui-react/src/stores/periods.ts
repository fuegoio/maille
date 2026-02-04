import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { Period } from "@/types/periods";

interface PeriodsState {
  getPeriodLabel: (period: Period) => "Completed" | "Current" | "Future";
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
  return {
    getPeriodLabel: periodsStore.getState().getPeriodLabel,
  };
}
