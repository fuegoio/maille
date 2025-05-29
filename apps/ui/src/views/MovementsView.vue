<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useMovementsStore } from "@/stores/movements";
import { useHeadStore } from "@/stores/head";

import AddMovementButton from "@/containers/movements/AddMovementButton.vue";
import ImportMovementsButton from "@/containers/movements/ImportMovementsButton.vue";
import MovementsTable from "@/containers/movements/MovementsTable.vue";
import MovementsFilters from "@/containers/movements/filters/MovementsFilters.vue";
import SearchBar from "@/containers/SearchBar.vue";
import MovementVue from "@/containers/movements//Movement.vue";
import type { UUID } from "crypto";

const route = useRoute();
const router = useRouter();

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
</script>

<template>
  <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
    <header class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center">
      <div class="text-sm font-semibold text-white truncate">Movements</div>
      <div class="flex-1" />

      <SearchBar />
      <ImportMovementsButton />
      <AddMovementButton class="ml-2" />
    </header>

    <MovementsFilters :view-id="viewId" :movements="movementsToShow" />
    <MovementsTable :view-id="viewId" :movements="movementsToShow" grouping="period" />
  </div>

  <MovementVue />
</template>
