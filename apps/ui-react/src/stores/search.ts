import { create } from "zustand";

interface SearchState {
  search: string;
  setSearch: (search: string) => void;
  clearSearch: () => void;
}

export const useSearch = create<SearchState>((set) => ({
  search: "",
  setSearch: (search) => set({ search }),
  clearSearch: () => set({ search: "" }),
}));
