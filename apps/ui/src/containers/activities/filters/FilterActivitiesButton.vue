<script setup lang="ts">
import { computed } from "vue";

import { useViewsStore } from "@/stores/views";

import {
  ActivityFilterFields,
  type ActivityFilter,
} from "@maille/core/activities";

const props = defineProps<{
  viewId: string;
}>();

const viewsStore = useViewsStore();
const activityView = computed(() => viewsStore.getActivityView(props.viewId));

const selectField = (field: ActivityFilter["field"]) => {
  activityView.value.filters.push({
    field: field,
    operator: undefined,
    value: undefined,
  } as ActivityFilter);
};
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <TSelect
    :model-value="null"
    :items="ActivityFilterFields"
    item-value="value"
    @update:model-value="selectField"
  >
    <template #default="{ open }">
      <button
        class="flex items-center rounded w-7 justify-center sm:w-auto sm:px-2.5 text-left text-sm h-7 border border-dashed hover:border-primary-300 text-primary-100 hover:text-white transition-colors shrink-0"
        :class="{
          'border-primary-300 text-white': open,
        }"
        v-bind="$attrs"
      >
        <i class="mdi mdi-filter-plus" />
        <span class="truncate ml-2 hidden sm:inline"> Filter </span>
      </button>
    </template>

    <template #item="{ item, active }">
      <div class="flex items-center">
        <i class="mdi mt-0.5" :class="item.icon" />
        <span class="block truncate ml-3" :class="{ 'font-medium': active }">
          {{ item.text }}
        </span>
      </div>
    </template>
  </TSelect>
</template>
