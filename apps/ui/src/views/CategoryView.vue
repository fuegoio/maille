<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useHeadStore } from "@/stores/head";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivitiesStore,
} from "@/stores/activities";
import { useViewsStore } from "@/stores/views";
import ActivitiesTable from "@/containers/activities/ActivitiesTable.vue";
import SearchBar from "@/containers/SearchBar.vue";
import FilterActivitiesButton from "@/containers/activities/filters/FilterActivitiesButton.vue";
import ActivityView from "@/containers/activities/Activity.vue";
import ShowTransactionsButton from "@/components/activities/ShowTransactionsButton.vue";
import type { ActivityCategory } from "@maille/core/activities";

const activitiesStore = useActivitiesStore();
const { activities } = storeToRefs(activitiesStore);

const viewsStore = useViewsStore();

const headStore = useHeadStore();

const route = useRoute();
const router = useRouter();

const viewLoaded = ref(false);
const category = ref<ActivityCategory | undefined>();

const loadRouteParams = async () => {
  await router.isReady();

  if (
    route.params.name !== null &&
    route.params.name !== undefined &&
    route.params.name !== ""
  ) {
    category.value = activitiesStore.categories.find(
      (c) => c.name.toLowerCase() === route.params.name,
    );
    if (!category.value) {
      headStore.updateTitle("Category not found");
    } else {
      headStore.updateTitle(category.value.name);
    }
  } else {
    router.replace({ name: "activities" });
    return;
  }

  viewLoaded.value = true;
};

loadRouteParams();

watch(
  () => route.params.name,
  () => {
    if (route.name === "category") loadRouteParams();
  },
);

const activityView = computed(() => {
  if (!category.value) return;
  return viewsStore.getActivityView(`category-${category.value.id}-page`);
});
</script>

<template>
  <template v-if="viewLoaded">
    <template v-if="category">
      <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
        <header class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center">
          <div class="flex items-center -ml-0.5">
            <div
              class="size-3 rounded shrink-0 mr-3"
              :class="`bg-${ACTIVITY_TYPES_COLOR[category.type]}-300`"
            />
            <span class="text-sm text-white font-semibold">
              {{ ACTIVITY_TYPES_NAME[category.type] }}
            </span>
          </div>
          <i class="mdi mdi-chevron-right px-2" />
          <div class="text-sm font-semibold text-white trancate">
            {{ category.name }}
          </div>

          <div class="flex-1 sm:hidden" />
          <FilterActivitiesButton
            v-if="activityView!.filters.length === 0"
            :view-id="activityView!.id"
            class="ml-4 mr-2"
          />

          <div class="flex-1 hidden sm:block" />
          <SearchBar />
          <ShowTransactionsButton />
        </header>

        <ActivitiesTable
          :activities="activities"
          :category-filter="category.id"
          :view-id="activityView!.id"
          grouping="period"
        />
      </div>

      <ActivityView />
    </template>
  </template>
</template>
