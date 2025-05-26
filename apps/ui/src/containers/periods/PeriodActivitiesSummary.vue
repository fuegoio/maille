<script setup lang="ts">
import Color from "colorjs.io";
import type { Dayjs } from "dayjs";
import _ from "lodash";
import { storeToRefs } from "pinia";
import { computed } from "vue";

import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivitiesStore,
} from "@/stores/activities";
import { usePeriodsStore } from "@/stores/periods";

import PeriodActivityCategoryLine from "@/containers/periods/PeriodActivityCategoryLine.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import { ActivityType } from "@maille/core/activities";
import type { PeriodActivityData } from "@/types/periods";

const activitiesStore = useActivitiesStore();
const { categories } = storeToRefs(activitiesStore);

const periodsStore = usePeriodsStore();
const { viewFilters, periodsActivityData } = storeToRefs(periodsStore);

const props = defineProps<{
  periodDate: Dayjs;
}>();

const periodActivityData = computed<PeriodActivityData>(() => {
  return periodsActivityData.value.find(
    (p) =>
      p.month === props.periodDate.month() &&
      p.year === props.periodDate.year(),
  )!;
});

const getCategories = (activityType: ActivityType) => {
  return _.sortBy(
    categories.value.filter((c) => c.type === activityType),
    "name",
  );
};

const selectActivityTypeToFilterActivities = (activityType: ActivityType) => {
  viewFilters.value.category = null;
  viewFilters.value.subcategory = null;
  if (viewFilters.value.activityType !== activityType) {
    viewFilters.value.activityType = activityType;
  } else {
    viewFilters.value.activityType = null;
  }
};

const getProgressBarColor = (index: number, activityType: ActivityType) => {
  const color = new Color(
    {
      [ActivityType.REVENUE]: "#4ade80",
      [ActivityType.EXPENSE]: "#f87171",
      [ActivityType.INVESTMENT]: "#fb923c",
      [ActivityType.NEUTRAL]: "#9ca3af",
    }[activityType],
  );
  color.lch.l =
    80 +
    (index / categories.value.filter((c) => c.type === activityType).length) *
      -50;
  return color;
};
</script>

<template>
  <div
    v-for="activityType in [
      {
        type: ActivityType.REVENUE,
        value: periodActivityData.revenue,
      },
      {
        type: ActivityType.EXPENSE,
        value: periodActivityData.expense,
      },
      {
        type: ActivityType.INVESTMENT,
        value: periodActivityData.investment,
      },
    ]"
    :key="activityType.type"
    class="border-b py-3 px-3 w-full"
  >
    <div
      class="flex items-center justify-between px-3 rounded group h-9 transition-colors"
      :class="
        viewFilters.activityType === activityType.type
          ? 'bg-primary-800'
          : 'hover:bg-primary-800'
      "
      @click="selectActivityTypeToFilterActivities(activityType.type)"
    >
      <div class="flex items-center">
        <div
          class="size-3 rounded shrink-0 mr-3"
          :class="`bg-${ACTIVITY_TYPES_COLOR[activityType.type]}-300`"
        />
        <span class="text-sm text-white font-medium">
          {{ ACTIVITY_TYPES_NAME[activityType.type] }}
        </span>
      </div>

      <div class="flex items-center">
        <div
          class="mr-4 text-primary-200 text-sm"
          :class="
            viewFilters.activityType === activityType.type
              ? ''
              : 'hidden group-hover:block'
          "
        >
          <template v-if="viewFilters.activityType === activityType.type">
            Clear filter
          </template>
          <template v-else> Filter </template>
        </div>

        <div
          class="whitespace-nowrap text-right text-white text-sm font-medium font-mono"
        >
          {{ getCurrencyFormatter().format(activityType.value) }}
        </div>
      </div>
    </div>

    <div class="px-2 mt-1 mb-2">
      <div
        v-if="activityType.value !== 0"
        class="w-full h-2 hover:h-4 transition-all rounded-md flex items-center overflow-hidden bg-primary-800"
      >
        <TTooltip
          v-for="(category, index) in categories.filter(
            (c) => c.type === activityType.type,
          )"
          :key="category.id"
          :text="`${category.name} (${_.round(
            ((periodActivityData.categories.find(
              (c) => c.category === category.id,
            )?.value ?? 0) /
              activityType.value) *
              100,
            2,
          )}%)`"
          placement="bottom"
          class="h-full transition-all hover:opacity-50"
          :style="`background-color: ${getProgressBarColor(
            index,
            activityType.type,
          )}; width: ${
            (100 / activityType.value) *
            (periodActivityData.categories.find(
              (c) => c.category === category.id,
            )?.value ?? 0)
          }%;`"
        />
      </div>
    </div>

    <PeriodActivityCategoryLine
      v-for="category in getCategories(activityType.type)"
      :key="category.id"
      :period-date="periodDate"
      :category="category"
    />
  </div>
</template>
