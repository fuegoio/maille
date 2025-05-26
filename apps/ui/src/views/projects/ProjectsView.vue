<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";

import ProjectDates from "@/containers/projects/ProjectDates.vue";
import AddProjectButton from "@/containers/projects/AddProjectButton.vue";

import { useProjectsStore } from "@/stores/projects";
import { ACTIVITY_TYPES_COLOR, useActivitiesStore } from "@/stores/activities";

import { getCurrencyFormatter } from "@/utils/currency";

import { ActivityType } from "@maille/core/activities";
import type { UUID } from "crypto";

const projectsStore = useProjectsStore();
const { projects } = storeToRefs(projectsStore);

const activitiesStore = useActivitiesStore();
const { activities } = storeToRefs(activitiesStore);

const activitiesTotal = computed(() => {
  const totals: Record<
    UUID,
    {
      [ActivityType.EXPENSE]?: number;
      [ActivityType.REVENUE]?: number;
      [ActivityType.INVESTMENT]?: number;
      [ActivityType.NEUTRAL]?: number;
    }
  > = {};

  projects.value.forEach((p) => {
    totals[p.id] = {};
  });

  activities.value.forEach((a) => {
    if (a.project !== null) {
      if (totals[a.project][a.type] === undefined) {
        totals[a.project][a.type] = a.amount;
      } else {
        totals[a.project][a.type]! += a.amount;
      }
    }
  });

  return totals;
});
</script>

<template>
  <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
    <header class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center">
      <div class="text-sm font-medium text-white">Projects</div>
      <div class="flex-1" />

      <AddProjectButton />
    </header>

    <div
      class="hidden xs:flex items-center h-8 border-b text-sm text-primary-200 px-8 bg-primary-800"
    >
      <div>Title</div>
      <div class="flex-1" />
      <div class="sm:mr-12 md:mr-6 xl:mr-20 xl:w-20">Status</div>
      <div class="w-32 mr-6 hidden md:block">Start date</div>
      <div class="w-32 mr-7 hidden md:block">End date</div>
      <div class="w-28 pl-6 hidden sm:block text-right">Investment</div>
      <div class="w-28 pl-6 hidden sm:block text-right">Revenue</div>
      <div class="w-28 pl-6 hidden sm:block text-right">Expense</div>
    </div>

    <div class="flex flex-1 flex-col min-h-0">
      <RouterLink
        v-for="project in projects"
        :key="project.id"
        :to="{ name: 'project', params: { id: project.id } }"
        class="h-12 flex items-center pl-3 pr-2 sm:px-5 border-b hover:bg-primary-800/20"
      >
        <TEmojiPicker
          v-model="project.emoji"
          class="text-sm mr-2"
          placeholder="mdi-book-multiple"
        />

        <div class="text-sm font-medium text-white truncate min-w-0">
          {{ project.name }}
        </div>

        <div class="flex-1" />

        <div
          class="flex items-center mr-1 sm:mr-12 md:mr-0 xl:mr-12 flex-shrink-0"
        >
          <i
            class="mdi mr-2 mt-0.5"
            :class="{
              'mdi-progress-clock text-primary-100':
                projectsStore.getProjectStatus(project) === 'scheduled',
              'mdi-progress-helper text-orange-300':
                projectsStore.getProjectStatus(project) === 'in progress',
              'mdi-check-circle-outline text-primary-100':
                projectsStore.getProjectStatus(project) === 'completed',
            }"
          />
          <div
            class="text-sm font-medium text-primary-100 hidden xl:block whitespace-nowrap min-w-0 capitalize w-20"
          >
            {{ projectsStore.getProjectStatus(project) }}
          </div>
        </div>

        <div class="hidden md:block mr-12 flex-shrink-0">
          <ProjectDates :project-id="project.id" />
        </div>

        <template
          v-for="activityType in [
            ActivityType.INVESTMENT,
            ActivityType.REVENUE,
            ActivityType.EXPENSE,
          ]"
          :key="activityType"
        >
          <div
            class="text-sm hidden sm:flex items-center px-3 my-1 w-28 flex-shrink-0"
          >
            <div
              class="h-[9px] w-[9px] rounded-xs shrink-0 mr-3 mt-[1px]"
              :class="`bg-${ACTIVITY_TYPES_COLOR[activityType]}-300`"
            />
            <div
              class="flex-1 text-right font-mono"
              :class="
                activitiesTotal[project.id][activityType]
                  ? 'text-white'
                  : 'text-primary-400'
              "
            >
              {{
                getCurrencyFormatter().format(
                  activitiesTotal[project.id][activityType] ?? 0,
                )
              }}
            </div>
          </div>
        </template>
      </RouterLink>
    </div>
  </div>
</template>
