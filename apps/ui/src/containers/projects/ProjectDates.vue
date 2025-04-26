<script setup lang="ts">
import { useProjectsStore } from "@/stores/projects";
import type { UUID } from "crypto";
import type { Dayjs } from "dayjs";
import { computed } from "vue";
import { useEventsStore } from "@/stores/events";
import { updateProjectMutation } from "@/mutations/projects";

const projectsStore = useProjectsStore();
const eventsStore = useEventsStore();

const props = defineProps<{
  projectId: UUID;
}>();

const project = computed(() => projectsStore.getProjectById(props.projectId));

const handleStartDateChange = (date: Dayjs | null) => {
  if (!project.value) return;

  if (date === null) {
    project.value.startDate = null;
    project.value.endDate = null;
  } else {
    project.value.startDate = date;
  }

  eventsStore.sendEvent({
    name: "updateProject",
    mutation: updateProjectMutation,
    variables: {
      id: project.value.id,
      startDate: date === null ? null : date.format("YYYY-MM-DD"),
    },
    rollbackData: { ...project.value },
  });
};

const handleEndDateChange = (date: Dayjs | null) => {
  if (!project.value) return;

  project.value.endDate = date;

  eventsStore.sendEvent({
    name: "updateProject",
    mutation: updateProjectMutation,
    variables: {
      id: project.value.id,
      endDate: date === null ? null : date.format("YYYY-MM-DD"),
    },
    rollbackData: { ...project.value },
  });
};
</script>

<template>
  <div v-if="project" class="flex items-center">
    <TDatePicker
      v-slot="{ open, value }"
      :model-value="project.startDate"
      @update:model-value="handleStartDateChange"
    >
      <div
        class="flex items-center px-2 rounded w-32 h-8"
        :class="open ? 'bg-primary-600' : 'hover:bg-primary-600'"
      >
        <i class="mdi mr-2 text-white mdi-calendar" />
        <div
          class="text-sm whitespace-nowrap"
          :class="value ? 'text-white' : 'text-primary-200'"
        >
          {{ value?.format("MMM DD") ?? "Start date" }}
        </div>

        <div class="flex-1" />
        <i
          v-if="open"
          class="mdi mdi-close text-primary-100 hover:text-white ml-2 mt-0.5"
          @click.prevent="handleStartDateChange(null)"
        />
      </div>
    </TDatePicker>

    <i class="mdi mdi-arrow-right-thin text-primary-600 mx-1" />

    <TDatePicker
      v-slot="{ open, value, disabled }"
      :model-value="project.endDate"
      :disabled="project.startDate === null"
      @update:model-value="handleEndDateChange"
    >
      <div
        class="flex items-center px-2 rounded w-32 h-8"
        :class="[
          open ? 'bg-primary-600' : '',
          disabled ? '' : 'hover:bg-primary-600',
        ]"
      >
        <i
          class="mdi mr-2 mdi-calendar"
          :class="disabled ? 'text-primary-400' : 'text-primary-200'"
        />
        <div
          class="text-sm whitespace-nowrap"
          :class="{
            'text-white': value,
            'text-primary-200': !disabled && !value,
            'text-primary-400': disabled,
          }"
        >
          {{ value?.format("MMM DD") ?? "End date" }}
        </div>

        <i
          v-if="open"
          class="mdi mdi-close text-primary-100 hover:text-white ml-2 mt-0.5"
          @click.prevent="handleEndDateChange(null)"
        />
      </div>
    </TDatePicker>
  </div>
</template>
