<script setup lang="ts">
import { storeToRefs } from "pinia";
import type { UUID } from "crypto";

import { useProjectsStore } from "@/stores/projects";

const props = defineProps<{
  modelValue: UUID | null;
}>();
const emit = defineEmits(["update:model-value"]);

const projectsStore = useProjectsStore();
const { projects } = storeToRefs(projectsStore);
</script>

<template>
  <TSelect
    :model-value="modelValue"
    :items="[{ id: null, name: 'No project' }, ...projects]"
    item-value="id"
    item-text="name"
    placeholder="Project"
    @update:model-value="emit('update:model-value', $event)"
  >
    <template #selected="{ item }">
      <span v-if="item !== null" class="text-white">
        <span class="mr-2">{{ item.emoji }}</span>
        {{ item.name }}
      </span>
    </template>

    <template #item="{ item, selected }">
      <div
        :class="[
          selected ? 'font-medium' : 'font-normal',
          'truncate flex items-center',
        ]"
      >
        <div class="w-6">{{ item.emoji }}</div>
        {{ item.name }}
      </div>
    </template>
  </TSelect>
</template>
