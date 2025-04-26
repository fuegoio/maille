import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useHeadStore = defineStore("head", () => {
  const title = ref<string | undefined>();

  watch(title, () => (document.title = title.value ?? "Maille"));

  const updateTitle = (newTitle: string | undefined) => {
    title.value = newTitle;
  };

  return {
    title,

    updateTitle,
  };
});
