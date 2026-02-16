import { create } from "zustand";
import { persist } from "zustand/middleware";

import { storage } from "./storage";

interface ThemeState {
  theme: "dark" | "light" | "system";
  setTheme: (theme: "dark" | "light") => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme",
      storage: storage,
    },
  ),
);
