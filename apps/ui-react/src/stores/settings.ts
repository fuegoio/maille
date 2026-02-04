import { createStore } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  startingPeriod: Date;
}

export const settingsStore = createStore<SettingsState>()(
  persist(
    () => ({
      startingPeriod: new Date(),
    }),
    {
      name: "settings",
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
  ),
);

// Custom hook to use the settings store
export function useSettingsStore() {
  return settingsStore;
}
