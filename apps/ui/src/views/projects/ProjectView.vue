<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useMotion } from "@vueuse/motion";

import { useViewsStore } from "@/stores/views";
import { useProjectsStore } from "@/stores/projects";
import { useActivitiesStore } from "@/stores/activities";
import { useHeadStore } from "@/stores/head";
import { useEventsStore } from "@/stores/events";

import ActivitiesTable from "@/containers/activities/ActivitiesTable.vue";
import FilterActivitiesButton from "@/containers/activities/filters/FilterActivitiesButton.vue";
import SearchBar from "@/containers/SearchBar.vue";
import ProjectActivitiesSummary from "@/containers/projects/ProjectActivitiesSummary.vue";
import ProjectDates from "@/containers/projects/ProjectDates.vue";
import AddAndEditProjectModal from "@/containers/projects/AddAndEditProjectModal.vue";
import ExportActivitiesButton from "@/containers/activities/ExportActivitiesButton.vue";
import ActivityView from "@/containers/activities/Activity.vue";

import ShowTransactionsButton from "@/components/activities/ShowTransactionsButton.vue";
import type { UUID } from "crypto";
import {
  deleteProjectMutation,
  updateProjectMutation,
} from "@/mutations/projects";

const router = useRouter();
const route = useRoute();

const viewsStore = useViewsStore();

const projectsStore = useProjectsStore();
const { viewFilters } = storeToRefs(projectsStore);

const activitiesStore = useActivitiesStore();
const { activities, focusedActivity } = storeToRefs(activitiesStore);

const eventsStore = useEventsStore();

const showEditModal = ref(false);

const project = computed(() => {
  return projectsStore.getProjectById(route.params.id as UUID);
});

watch(
  () => route.params.period,
  () => {
    if (route.name !== "project") return;

    if (!project.value) {
      router.replace({ name: "projects" });
      return;
    }

    useHeadStore().updateTitle(project.value.name);
  },
  { immediate: true },
);

const activityView = computed(() => {
  if (!project.value) return;
  return viewsStore.getActivityView(`project-${project.value.id}-page`);
});

const projectActivities = computed(() => {
  if (!project.value) return;
  return activities.value.filter(
    (activity) => activity.project === project.value!.id,
  );
});

const handleProjectMenuClick = (event: string) => {
  if (event === "delete") {
    eventsStore.sendEvent({
      name: "deleteProject",
      mutation: deleteProjectMutation,
      variables: {
        id: project.value!.id,
      },
      rollbackData: {
        project: { ...project.value! },
        activities: projectActivities.value!.map((activity) => activity.id),
      },
    });

    projectsStore.deleteProject(project.value!.id);

    router.push({ name: "projects" });
  } else if (event === "edit") {
    showEditModal.value = true;
  }
};

const resetFilters = () => {
  viewFilters.value = {
    category: null,
    subcategory: null,
    activityType: null,
  };
};

onBeforeUnmount(() => {
  resetFilters();
});

// Drawer

const drawerElement = ref<HTMLElement>();
const isDrawerOpen = ref(window.innerWidth > 420);

const toggleDrawer = () => {
  if (isDrawerOpen.value) {
    useMotion(drawerElement, {
      initial: {
        marginLeft: 0,
        x: 0,
      },
      enter: {
        marginLeft: -460,
        x: 460,
        transition: {
          type: "spring",
          stiffness: 250,
          damping: 25,
          mass: 0.5,
        },
      },
    });

    setTimeout(() => {
      isDrawerOpen.value = false;
    }, 100);
  } else {
    isDrawerOpen.value = true;
    useMotion(drawerElement, {
      initial: {
        marginLeft: -460,
        x: 460,
      },
      enter: {
        marginLeft: 0,
        x: 0,
        transition: {
          type: "spring",
          stiffness: 250,
          damping: 25,
          mass: 0.5,
        },
      },
    });
  }
};

watch(focusedActivity, () => {
  if (focusedActivity.value) {
    isDrawerOpen.value = false;
  }
});

const handleEmojiChange = (emoji: string) => {
  if (!project.value) return;

  project.value.emoji = emoji;

  eventsStore.sendEvent({
    name: "updateProject",
    mutation: updateProjectMutation,
    variables: {
      id: project.value.id,
      emoji,
    },
    rollbackData: { ...project.value },
  });
};
</script>

<template>
  <template v-if="project">
    <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
      <header class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center">
        <div class="text-sm mr-3">{{ project.emoji }}</div>
        <div class="text-sm font-medium truncate mr-4 text-white">
          {{ project.name }}
        </div>

        <div class="flex-1 sm:hidden" />
        <template v-if="activityView!.filters.length === 0">
          <FilterActivitiesButton :view-id="activityView!.id" class="mx-2" />
          <ExportActivitiesButton
            class="hidden sm:block"
            :view-id="activityView!.id"
            :activities="projectActivities!"
          />
        </template>

        <div class="flex-1 hidden sm:block" />
        <SearchBar />

        <ShowTransactionsButton />

        <div class="mx-3 w-[1px] bg-primary-700 h-6 hidden sm:block" />

        <TTooltip text="Show period side panel">
          <button
            type="button"
            class="ml-2 sm:ml-0 inline-flex items-center justify-center transition text-primary-100 hover:text-white hover:bg-primary-800 rounded h-7 w-7"
            :class="
              isDrawerOpen ? 'bg-primary-800 text-white' : 'bg-transparent'
            "
            @click="toggleDrawer"
          >
            <i class="mdi mdi-view-split-vertical text-lg" />
          </button>
        </TTooltip>
      </header>

      <ActivitiesTable
        class="min-w-0"
        :activities="projectActivities!"
        :category-filter="viewFilters.category"
        :subcategory-filter="viewFilters.subcategory"
        :activity-type-filter="viewFilters.activityType"
        :view-id="activityView!.id"
        hide-project
      />
    </div>

    <div
      v-if="isDrawerOpen"
      ref="drawerElement"
      class="relative flex flex-col items-center w-full shrink-0 sm:max-w-[420px] h-full border shadow-xl overflow-y-auto pb-10 bg-primary-900 rounded"
    >
      <div class="border-b p-6 w-full flex items-center">
        <div class="text-lg text-white font-bold flex items-center">
          <TEmojiPicker
            :model-value="project.emoji"
            class="mr-3"
            placeholder="mdi-book-multiple"
            @update:model-value="handleEmojiChange"
          />
          {{ project.name }}
        </div>

        <div class="flex-1" />
        <TMenu
          class="mr-2 sm:mr-0"
          :items="[
            { value: 'edit', text: 'Edit project', icon: 'pencil' },
            { value: 'delete', text: 'Delete project', icon: 'delete' },
          ]"
          @click:item="handleProjectMenuClick($event)"
        />
      </div>

      <div class="border-b p-6 w-full">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium">Dates</div>
          <ProjectDates :project-id="project.id" />
        </div>
      </div>

      <ProjectActivitiesSummary :project-activities="projectActivities!" />
    </div>

    <ActivityView />

    <AddAndEditProjectModal v-model="showEditModal" :project-id="project.id" />
  </template>
</template>
