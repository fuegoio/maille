<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";

import {
  useActivitiesStore,
  ACTIVITY_TYPES_NAME,
  ACTIVITY_TYPES_COLOR,
} from "@/stores/activities";
import { useProjectsStore } from "@/stores/projects";

import ProjectActivityCategoryLine from "@/containers/projects/ProjectActivityCategoryLine.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import { ActivityType, type Activity } from "@maille/core/activities";

const activitiesStore = useActivitiesStore();
const { categories } = storeToRefs(activitiesStore);

const projectsStore = useProjectsStore();
const { viewFilters } = storeToRefs(projectsStore);

const props = defineProps<{
  projectActivities: Activity[];
}>();

const activitiesTotal = computed(() => {
  const totals: {
    [ActivityType.EXPENSE]?: number;
    [ActivityType.REVENUE]?: number;
    [ActivityType.INVESTMENT]?: number;
    [ActivityType.NEUTRAL]?: number;
  } = {};

  props.projectActivities.forEach((a) => {
    if (totals[a.type] === undefined) {
      totals[a.type] = a.amount;
    } else {
      totals[a.type]! += a.amount;
    }
  });

  return totals;
});

const selectActivityTypeToFilterActivities = (activityType: ActivityType) => {
  viewFilters.value.category = null;
  viewFilters.value.subcategory = null;
  if (viewFilters.value.activityType !== activityType) {
    viewFilters.value.activityType = activityType;
  } else {
    viewFilters.value.activityType = null;
  }
};
</script>

<template>
  <template
    v-for="activityType in [
      ActivityType.REVENUE,
      ActivityType.EXPENSE,
      ActivityType.INVESTMENT,
    ]"
    :key="activityType"
  >
    <div class="border-b py-3 px-3 w-full">
      <div
        class="flex items-center justify-between px-3 rounded group h-9"
        :class="[
          viewFilters.activityType === activityType
            ? 'bg-primary-800'
            : 'hover:bg-primary-800',
          activitiesTotal[activityType] !== undefined ? 'mb-3' : '',
        ]"
        @click="selectActivityTypeToFilterActivities(activityType)"
      >
        <div class="flex items-center">
          <div
            class="size-3 rounded shrink-0 mr-3"
            :class="`bg-${ACTIVITY_TYPES_COLOR[activityType]}-300`"
          />
          <span
            class="text-sm font-medium"
            :class="
              activitiesTotal[activityType] !== undefined
                ? 'text-white'
                : 'text-primary-600'
            "
          >
            {{ ACTIVITY_TYPES_NAME[activityType] }}
          </span>
        </div>

        <div class="flex items-center">
          <div
            class="mr-4 text-primary-200 text-sm"
            :class="
              viewFilters.activityType === activityType
                ? ''
                : 'hidden group-hover:block'
            "
          >
            <template v-if="viewFilters.activityType === activityType">
              Clear filter
            </template>
            <template v-else> Filter </template>
          </div>

          <div
            class="whitespace-nowrap text-right text-sm font-medium font-mono"
            :class="
              activitiesTotal[activityType] !== undefined
                ? 'text-white'
                : 'text-primary-600'
            "
          >
            {{
              getCurrencyFormatter().format(activitiesTotal[activityType] ?? 0)
            }}
          </div>
        </div>
      </div>

      <ProjectActivityCategoryLine
        v-for="category in categories.filter((c) => c.type === activityType)"
        :key="category.id"
        :project-activities="projectActivities"
        :category="category"
      />
    </div>
  </template>
</template>
