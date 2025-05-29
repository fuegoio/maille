<script setup lang="ts">
import { computed } from "vue";

import { useViewsStore } from "@/stores/views";

import FilterMovementsButton from "@/containers/movements/filters/FilterMovementsButton.vue";

import MovementFilter from "@/components/movements/filters/MovementFilter.vue";

import type { Movement } from "@maille/core/movements";

import { getCurrencyFormatter } from "@/utils/currency";

const props = defineProps<{
  viewId: string;
  movements: Movement[];
}>();

const viewsStore = useViewsStore();
const movementView = computed(() => viewsStore.getMovementView(props.viewId));

const movementsTotal = computed(() => {
  return props.movements.reduce(
    (total, movement) => total + movement.amount,
    0,
  );
});

console.log(movementView);
</script>

<template>
  <div
    v-if="movementView.filters.length > 0"
    class="py-2 flex flex-col md:flex-row md:items-start pl-4 sm:pl-6 pr-4 border-b gap-2 sm:min-w-[575px]"
  >
    <div class="flex items-center gap-2 flex-wrap">
      <MovementFilter
        v-for="(filter, index) in movementView.filters"
        :key="index"
        :model-value="filter"
        @update:model-value="movementView.filters[index] = $event"
        @delete="movementView.filters.splice(index, 1)"
      />

      <FilterMovementsButton :view-id="movementView.id" />
    </div>

    <div class="flex items-end sm:items-center flex-1 mt-2 sm:mt-0 sm:ml-2">
      <div class="flex-1 hidden sm:block" />

      <div class="flex pr-2 mr-4 sm:border-r flex-col sm:flex-row">
        <div class="text-sm text-right flex items-center px-2 my-1 font-mono">
          {{ getCurrencyFormatter().format(movementsTotal) }}
        </div>
      </div>

      <div class="flex-1 sm:hidden" />

      <button
        class="flex items-center rounded px-2.5 text-left text-sm h-7 border border-dashed hover:border-primary-300 hover:text-white transition-colors"
        @click="movementView.filters = []"
      >
        <span class="block truncate mr-2"> Clear </span>
        <i class="mdi mdi-close" />
      </button>
    </div>
  </div>
</template>
