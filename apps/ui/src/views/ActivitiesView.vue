<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useHeadStore } from "@/stores/head";
import { useActivitiesStore } from "@/stores/activities";
import { useViewsStore } from "@/stores/views";
import ActivitiesTable from "@/containers/activities/ActivitiesTable.vue";
import SearchBar from "@/containers/SearchBar.vue";
import ShowTransactionsButton from "@/components/activities/ShowTransactionsButton.vue";
import AddActivityButton from "@/containers/activities/AddActivityButton.vue";
import FilterActivitiesButton from "@/containers/activities/filters/FilterActivitiesButton.vue";
import ExportActivitiesButton from "@/containers/activities/ExportActivitiesButton.vue";
import ActivityView from "@/containers/activities/Activity.vue";

const activitiesStore = useActivitiesStore();
const { activities, focusedActivity } = storeToRefs(activitiesStore);

const viewsStore = useViewsStore();

const headStore = useHeadStore();

const route = useRoute();
const router = useRouter();

const viewLoaded = ref(false);

const loadRouteParams = async () => {
  await router.isReady();

  if (
    route.params.id !== null &&
    route.params.id !== undefined &&
    route.params.id !== "" &&
    route.params.id !== "reconciliation"
  ) {
    const activity = activitiesStore.getActivityByNumber(
      parseInt(route.params.id as string),
    );
    if (!activity) return;

    focusedActivity.value = activity.id;
  }

  if (route.params.id !== "reconciliation") {
    headStore.updateTitle("Activities");
  } else {
    headStore.updateTitle("Activities to reconciliate");
  }

  viewLoaded.value = true;
};

loadRouteParams();

watch(
  () => route.params.id,
  () => {
    if (route.name === "activities") loadRouteParams();
  },
);

const viewActivities = computed(() => {
  if (!viewLoaded.value) return undefined;

  return activities.value.filter((activity) => {
    if (route.params.id === "reconciliation") {
      return activity.status === "incomplete";
    }
    return true;
  });
});

const activityView = computed(() => {
  return viewsStore.getActivityView(
    route.params.id === "reconciliation"
      ? "activities-reconciliate-page"
      : "activities-page",
  );
});
</script>

<template>
  <template v-if="viewLoaded">
    <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
      <header class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center">
        <div class="text-sm font-semibold truncate text-white">
          <template v-if="route.params.id === 'reconciliation'">
            Activities to reconciliate
          </template>
          <template v-else> Activities </template>
        </div>

        <div class="flex-1 sm:hidden" />
        <template v-if="activityView.filters.length === 0">
          <FilterActivitiesButton
            :view-id="activityView.id"
            class="ml-4 sm:mr-2"
          />
          <ExportActivitiesButton
            class="hidden sm:block"
            :view-id="activityView.id"
            :activities="viewActivities!"
          />
        </template>

        <div class="flex-1 hidden sm:block" />
        <SearchBar />

        <AddActivityButton class="mr-3" />
        <ShowTransactionsButton />
      </header>

      <ActivitiesTable
        :view-id="activityView.id"
        :activities="viewActivities!"
        grouping="period"
      />
    </div>

    <ActivityView />
  </template>
</template>
