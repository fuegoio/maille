import { useRouterState } from "@tanstack/react-router";
import { create } from "zustand";

interface SearchState {
  search: Record<string, string>;
  setSearch: (key: string, search: string) => void;
  clearSearch: (key: string) => void;
}

const useSearchStore = create<SearchState>((set) => ({
  search: {},
  setSearch: (key, search) =>
    set((state) => ({ search: { ...state.search, [key]: search } })),
  clearSearch: (key) =>
    set((state) => ({ search: { ...state.search, [key]: "" } })),
}));

/**
 * The search state of the current view (identified by its route path), so
 * searching the movements page does not filter the activities page. Each
 * view keeps its own search across navigation, like its scroll position.
 */
export function useViewSearch() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useSearchStore((state) => state.search[pathname] ?? "");
  const setSearch = useSearchStore((state) => state.setSearch);
  const clearSearch = useSearchStore((state) => state.clearSearch);

  return {
    search,
    setSearch: (value: string) => setSearch(pathname, value),
    clearSearch: () => clearSearch(pathname),
  };
}
