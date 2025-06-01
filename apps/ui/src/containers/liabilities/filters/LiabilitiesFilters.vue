<script setup lang="ts">
import { computed } from "vue";

import { useViewsStore } from "@/stores/views";

import FilterLiabilitiesButton from "@/containers/liabilities/filters/FilterLiabilitiesButton.vue";

import LiabilityFilter from "@/components/liabilities/filters/LiabilityFilter.vue";

import type { Liability } from "@maille/core/liabilities";

import { getCurrencyFormatter } from "@/utils/currency";

const props = defineProps<{
  viewId: string;
  liabilities: Liability[];
}>();

const viewsStore = useViewsStore();
const liabilityView = computed(() => viewsStore.getLiabilityView(props.viewId));

const liabilitiesTotal = computed(() => {
  return props.liabilities.reduce(
    (total, liability) => total + liability.amount,
    0,
  );
});
</script>

<template>
  <div
    v-if="liabilityView.filters.length > 0"
    class="py-2 flex flex-col md:flex-row md:items-start pl-4 sm:pl-6 pr-4 border-b gap-2 sm:min-w-[575px]"
  >
    <div class="flex items-center gap-2 flex-wrap">
      <LiabilityFilter
        v-for="(filter, index) in liabilityView.filters"
        :key="index"
        :model-value="filter"
        @update:model-value="liabilityView.filters[index] = $event"
        @delete="liabilityView.filters.splice(index, 1)"
      />

      <FilterLiabilitiesButton :view-id="liabilityView.id" />
    </div>

    <div class="flex items-end sm:items-center flex-1 mt-2 sm:mt-0 sm:ml-2">
      <div class="flex-1 hidden sm:block" />

      <div class="flex pr-2 mr-4 sm:border-r flex-col sm:flex-row">
        <div class="text-sm text-right flex items-center px-2 my-1 font-mono">
          {{ getCurrencyFormatter().format(liabilitiesTotal) }}
        </div>
      </div>

      <div class="flex-1 sm:hidden" />

      <button
        class="flex items-center rounded px-2.5 text-left text-sm h-7 border border-dashed hover:border-primary-300 hover:text-white transition-colors"
        @click="liabilityView.filters = []"
      >
        <span class="block truncate mr-2"> Clear </span>
        <i class="mdi mdi-close" />
      </button>
    </div>
  </div>
</template>