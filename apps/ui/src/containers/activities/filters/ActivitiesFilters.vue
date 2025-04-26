<script setup lang="ts">
import { computed } from "vue";

import { useViewsStore } from "@/stores/views";

import FilterActivitiesButton from "@/containers/activities/filters/FilterActivitiesButton.vue";
import ExportActivitiesButton from "@/containers/activities/ExportActivitiesButton.vue";

import ActivityFilter from "@/components/activities/filters/ActivityFilter.vue";

import { ACTIVITY_TYPES_COLOR } from "@/stores/activities";

import { ActivityType, type Activity } from "@maille/core/activities";

import { getCurrencyFormatter } from "@/utils/currency";

const props = defineProps<{
  viewId: string;
  activities: Activity[];
}>();

const viewsStore = useViewsStore();
const activityView = computed(() => viewsStore.getActivityView(props.viewId));

const activitiesTotal = computed(() => {
  const totals: {
    [ActivityType.EXPENSE]?: number;
    [ActivityType.REVENUE]?: number;
    [ActivityType.INVESTMENT]?: number;
    [ActivityType.NEUTRAL]?: number;
  } = {};

  props.activities.forEach((a) => {
    if (totals[a.type] === undefined) {
      totals[a.type] = a.amount;
    } else {
      totals[a.type]! += a.amount;
    }
  });

  return totals;
});
</script>

<template>
  <div
    v-if="activityView.filters.length > 0"
    class="py-2 flex flex-col md:flex-row md:items-start pl-4 sm:pl-6 pr-4 border-b gap-2 sm:min-w-[575px]"
  >
    <div class="flex items-center gap-2 flex-wrap">
      <ActivityFilter
        v-for="(filter, index) in activityView.filters"
        :key="index"
        :model-value="filter"
        @update:model-value="activityView.filters[index] = $event"
        @delete="activityView.filters.splice(index, 1)"
      />

      <FilterActivitiesButton :view-id="activityView.id" />
    </div>

    <div class="flex items-end sm:items-center flex-1 mt-2 sm:mt-0 sm:ml-2">
      <div class="flex-1 hidden sm:block" />

      <div class="flex pr-2 mr-4 sm:border-r flex-col sm:flex-row">
        <template
          v-for="activityType in [
            ActivityType.INVESTMENT,
            ActivityType.REVENUE,
            ActivityType.EXPENSE,
          ]"
          :key="activityType"
        >
          <div
            v-if="activitiesTotal[activityType]"
            class="text-sm text-right flex items-center px-2 my-1 font-mono"
          >
            <div
              class="h-[9px] w-[9px] rounded-xl shrink-0 mr-3"
              :class="`bg-${ACTIVITY_TYPES_COLOR[activityType]}-300`"
            />
            {{ getCurrencyFormatter().format(activitiesTotal[activityType]!) }}
          </div>
        </template>
      </div>

      <div class="flex-1 sm:hidden" />

      <ExportActivitiesButton
        class="mr-2"
        :view-id="activityView.id"
        :activities="activities"
      />
      <button
        class="flex items-center rounded px-2.5 text-left text-sm h-7 border border-dashed hover:border-primary-300 hover:text-white transition-colors"
        @click="activityView.filters = []"
      >
        <span class="block truncate mr-2"> Clear </span>
        <i class="mdi mdi-close" />
      </button>
    </div>
  </div>
</template>
