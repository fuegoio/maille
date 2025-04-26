<script setup lang="ts">
import type { Dayjs } from "dayjs";
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";

import { usePeriodsStore } from "@/stores/periods";
import { useActivitiesStore } from "@/stores/activities";

import { getCurrencyFormatter } from "@/utils/currency";

import type {
  ActivityCategory,
  ActivitySubCategory,
} from "@maille/core/activities";
import type { UUID } from "crypto";

const props = defineProps<{
  periodDate: Dayjs;
  category: ActivityCategory;
}>();

const activitiesStore = useActivitiesStore();
const { activities, subcategories } = storeToRefs(activitiesStore);

const periodsStore = usePeriodsStore();
const { viewFilters, periodsActivityData } =
  storeToRefs(periodsStore);

const expanded = ref(false);

const periodActivityCategoryValue = computed<number>(() => {
  return (
    periodsActivityData.value
      .find(
        (p) =>
          p.month === props.periodDate.month() &&
          p.year === props.periodDate.year(),
      )!
      .categories.find((c) => c.category === props.category.id)?.value ?? 0
  );
});

const categorySubcategories = computed(() => {
  return subcategories.value.filter((sc) => sc.category === props.category.id);
});

const subcategoriesValues = computed(() => {
  const subcategoriesValues: Record<UUID, number> = {};
  categorySubcategories.value.forEach((subcategory) => {
    subcategoriesValues[subcategory.id] = 0;
  });

  activities.value
    .filter(
      (activity) =>
        activity.date.month() === props.periodDate.month() &&
        activity.date.year() === props.periodDate.year() &&
        activity.category === props.category.id &&
        activity.subcategory !== null,
    )
    .forEach((activity) => {
      if (subcategoriesValues[activity.subcategory!] !== undefined) {
        subcategoriesValues[activity.subcategory!] += activity.amount;
      }
    });

  return subcategoriesValues;
});

const selectCategoryToFilterActivities = () => {
  viewFilters.value.subcategory = null;
  viewFilters.value.activityType = null;
  if (viewFilters.value.category !== props.category.id) {
    viewFilters.value.category = props.category.id;
  } else {
    viewFilters.value.category = null;
  }
};

const selectSubcategoryToFilterActivities = (
  subcategory: ActivitySubCategory,
) => {
  viewFilters.value.category = null;
  viewFilters.value.activityType = null;
  if (viewFilters.value.subcategory !== subcategory.id) {
    viewFilters.value.subcategory = subcategory.id;
  } else {
    viewFilters.value.subcategory = null;
  }
};
</script>

<template>
  <div
    class="flex items-center justify-between h-9 rounded px-3 group transition-colors"
    :class="
      viewFilters.category === props.category.id
        ? 'bg-primary-800'
        : 'hover:bg-primary-800'
    "
    @click="selectCategoryToFilterActivities"
  >
    <div
      class="text-xs text-white font-medium flex items-center"
      :class="categorySubcategories.length === 0 ? 'pl-6' : ''"
    >
      <button
        v-if="categorySubcategories.length > 0"
        class="h-4 w-4 flex items-center mr-2"
        @click.stop="expanded = !expanded"
      >
        <i
          class="mdi"
          :class="expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
        />
      </button>
      {{ category.name }}
    </div>

    <div class="flex items-center">
      <div
        class="mr-4 text-primary-200 text-sm"
        :class="
          viewFilters.category === props.category.id
            ? ''
            : 'hidden group-hover:block '
        "
      >
        <template v-if="viewFilters.category === props.category.id">
          Clear filter
        </template>
        <template v-else> Filter </template>
      </div>

      <div class="whitespace-nowrap text-white text-sm font-mono">
        {{ getCurrencyFormatter().format(periodActivityCategoryValue) }}
      </div>
    </div>
  </div>

  <div v-if="expanded" class="mb-2">
    <div
      v-for="subcategory in categorySubcategories"
      :key="subcategory.id"
      class="flex items-center h-9 rounded ml-4 pl-5 pr-3 group justify-between"
      :class="
        viewFilters.subcategory === subcategory.id
          ? 'bg-primary-800'
          : 'hover:bg-primary-950'
      "
      @click="selectSubcategoryToFilterActivities(subcategory)"
    >
      <div class="text-xs text-primary-700 font-medium flex items-center">
        {{ subcategory.name }}
      </div>

      <div class="flex items-center">
        <div
          class="mr-4 text-primary-300 text-sm"
          :class="
            viewFilters.subcategory === subcategory.id
              ? ''
              : 'hidden group-hover:block '
          "
        >
          <template v-if="viewFilters.subcategory === subcategory.id">
            Clear filter
          </template>
          <template v-else> Filter </template>
        </div>

        <div class="whitespace-nowrap text-primary-300 text-sm">
          {{
            getCurrencyFormatter().format(subcategoriesValues[subcategory.id]!)
          }}
        </div>
      </div>
    </div>
  </div>
</template>
