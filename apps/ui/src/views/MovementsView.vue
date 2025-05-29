<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useMovementsStore } from "@/stores/movements";
import { useHeadStore } from "@/stores/head";

import AddMovementButton from "@/containers/movements/AddMovementButton.vue";
import ImportMovementsButton from "@/containers/movements/ImportMovementsButton.vue";
import MovementsTable from "@/containers/movements/MovementsTable.vue";
import SearchBar from "@/containers/SearchBar.vue";
import MovementVue from "@/containers/movements//Movement.vue";
import type { UUID } from "crypto";
import FilterMovementsButton from "@/containers/movements/filters/FilterMovementsButton.vue";
import { useViewsStore } from "@/stores/views";

const route = useRoute();
const router = useRouter();

const viewsStore = useViewsStore();
const headStore = useHeadStore();

const movementsStore = useMovementsStore();
const { movements, focusedMovement } = storeToRefs(movementsStore);

const viewLoaded = ref(false);

const loadRouteParams = async () => {
  await router.isReady();

  if (
    route.params.id !== null &&
    route.params.id !== undefined &&
    route.params.id !== "" &&
    route.params.id !== "tolink"
  ) {
    const movement = movementsStore.getMovementById(route.params.id as UUID);
    if (!movement) return;

    focusedMovement.value = movement.id;
  }

  if (route.params.id !== "tolink") {
    headStore.updateTitle("Movements");
  } else {
    headStore.updateTitle("Movements to link");
  }

  viewLoaded.value = true;
};

loadRouteParams();

watch(
  () => route.params.id,
  () => {
    if (route.name === "movements") loadRouteParams();
  },
);

const movementsToShow = computed(() => {
  return movements.value.filter((movement) => {
    if (route.params.id === "tolink") {
      return movement.status === "incomplete";
    }
    return true;
  });
});

const viewId = computed(() => {
  return route.params.id === "tolink" ? "movements-tolink" : "movements-all";
});

const movementsView = computed(() => {
  return viewsStore.getMovementView(viewId.value);
});
</script>

<template>
  <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
    <header class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center">
      <div class="text-sm font-semibold text-white truncate">Movements</div>

      <div class="flex-1 sm:hidden" />
      <template v-if="movementsView.filters.length === 0">
        <FilterMovementsButton
          :view-id="movementsView.id"
          class="ml-4 sm:mr-2"
        />
      </template>

      <div class="flex-1 hidden sm:block" />
      <SearchBar />
      <ImportMovementsButton />
      <AddMovementButton class="ml-2" />
    </header>

    <MovementsTable
      :view-id="viewId"
      :movements="movementsToShow"
      grouping="period"
    />
  </div>

  <MovementVue />
</template>
