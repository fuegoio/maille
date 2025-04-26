import dayjs from "dayjs";
import { defineStore } from "pinia";
import { ref } from "vue";
import type { RouteLocationNormalized } from "vue-router";
import { useStorage } from "@vueuse/core";

import type { Settings } from "@maille/core/settings";

export const useSettingsStore = defineStore("settings", () => {
  const settings = useStorage<Settings>("settings", {
    startingPeriod: dayjs().format("YYYY-MM"),
    currency: "EUR",
  });
  const previousRoute = ref<RouteLocationNormalized | undefined>();

  return {
    settings,
    previousRoute,
  };
});
