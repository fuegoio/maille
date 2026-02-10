import { create } from "zustand";
import { searchCompare } from "@/lib/strings";

interface SearchState {
  search: string;
  setSearch: (search: string) => void;
  clearSearch: () => void;
  filterStringBySearch: (text: string) => boolean;
}

export const useSearch = create<SearchState>((set, get) => ({
  search: "",
  setSearch: (search) => set({ search }),
  clearSearch: () => set({ search: "" }),
  filterStringBySearch: (text) => {
    const { search } = get();
    return searchCompare(search, text);
  },
}));
