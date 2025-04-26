<script setup lang="ts">
import { computed } from "vue";

import { stringify } from "csv-stringify/browser/esm/sync";

import { useViewsStore } from "@/stores/views";

import type { Activity } from "@maille/core/activities";
import { verifyActivityFilter } from "@maille/core/activities";

const props = defineProps<{
  viewId: string;
  activities: Activity[];
}>();

const activityView = computed(() =>
  useViewsStore().getActivityView(props.viewId),
);

const filteredActivities = computed(() => {
  return props.activities.filter((activity) => {
    if (activityView.value.filters.length === 0) return true;

    return activityView.value.filters
      .map((filter) => {
        return verifyActivityFilter(filter, activity);
      })
      .every((f) => f);
  });
});

const exportActivities = () => {
  const csvFile = stringify([
    ["number", "date", "name", "amount"],
    ...filteredActivities.value.map((a) => [
      a.number,
      a.date.format("YYYY-MM-DD"),
      a.name,
      a.amount,
    ]),
  ]);

  const url = window.URL.createObjectURL(new Blob([csvFile]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `activities_export.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
</script>

<template>
  <TTooltip text="Export activities">
    <button
      type="button"
      class="inline-flex items-center justify-center transition text-primary-100 hover:text-white hover:border-primary-300 rounded h-7 w-7 border border-dashed"
      @click="exportActivities"
    >
      <i class="mdi mdi-download mt-0.5" />
    </button>
  </TTooltip>
</template>
