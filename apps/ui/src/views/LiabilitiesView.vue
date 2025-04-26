<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

import { useLiabilitiesStore } from "@/stores/liabilities";
import { useHeadStore } from "@/stores/head";

import LiabilitiesTable from "@/containers/liabilities/LiabilitiesTable.vue";
import SearchBar from "@/containers/SearchBar.vue";
import { useViewsStore } from "@/stores/views";
import { computed } from "vue";
import ExportLiabilitiesButton from "@/containers/liabilities/ExportLiabilitiesButton.vue";

const router = useRouter();

const headStore = useHeadStore();
const viewsStore = useViewsStore();

const liabilitiesStore = useLiabilitiesStore();
const { liabilities } = storeToRefs(liabilitiesStore);

const loadRouteParams = async () => {
  await router.isReady();
  headStore.updateTitle("Movements");
};

loadRouteParams();

const liabilityView = computed(() => {
  return viewsStore.getLiabilityView("liabilities-page");
});
</script>

<template>
  <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
    <header class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center">
      <div class="text-sm font-semibold text-white truncate">Liabilities</div>
      <div class="flex-1" />
      <template v-if="liabilityView.filters.length === 0">
        <ExportLiabilitiesButton
          class="hidden sm:block ml-4"
          :view-id="liabilityView.id"
          :liabilities="liabilities"
        />
      </template>
      <SearchBar />
    </header>

    <LiabilitiesTable :liabilities="liabilities" grouping="period" />
  </div>
</template>
