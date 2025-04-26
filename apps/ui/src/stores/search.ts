import { defineStore } from "pinia";
import { ref } from "vue";

import { searchCompare } from "@/utils/strings";

export const useSearchStore = defineStore("search", () => {
  const search = ref("");

  const filterStringBySearch = (text: string) => {
    return searchCompare(search.value, text);
  };

  return {
    search,
    filterStringBySearch,
  };
});
