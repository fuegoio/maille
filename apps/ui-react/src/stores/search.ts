import { create } from "zustand";

interface SearchState {
  search: string;
  setSearch: (search: string) => void;
  clearSearch: () => void;
  filterStringBySearch: (text: string) => boolean;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  search: "",
  setSearch: (search) => set({ search }),
  clearSearch: () => set({ search: "" }),
  filterStringBySearch: (text) => {
    const { search } = get();
    return searchCompare(search, text);
  },
}));

function escapeAccents(string: string): string {
  return string.normalize("NFD").replace(/[\u0300-\u036F]/g, "");
}

export function searchCompare(search: string, value: string): boolean {
  const valueUniform = escapeAccents(value).toLowerCase();
  const searchUniform = escapeAccents(search).toLowerCase();
  return valueUniform.includes(searchUniform.toLowerCase());
}