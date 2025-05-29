<script setup lang="ts">
import type { UUID } from "crypto";
import { computed, ref } from "vue";
import AddActivityModal from "../activities/AddActivityModal.vue";
import { useMovementsStore } from "@/stores/movements";
import { storeToRefs } from "pinia";

const props = defineProps<{
  selectedMovements: UUID[];
}>();

defineEmits<{
  clearSelection: [];
}>();

const show = computed(() => props.selectedMovements.length > 0);

const movementsStore = useMovementsStore();
const { movements } = storeToRefs(movementsStore);

const selectedMovements = computed(() =>
  movements.value.filter((m) => props.selectedMovements.includes(m.id)),
);

const showCreateActivities = ref(false);
</script>

<template>
  <div v-if="show" class="absolute bottom-5 w-full flex justify-center">
    <div class="flex gap-2 p-2 shadow bg-primary-950 rounded items-center">
      <button
        class="flex items-center rounded px-2.5 text-left text-sm h-7 border border-dashed hover:border-primary-300 hover:text-white transition-colors"
        @click="$emit('clearSelection')"
      >
        <span class="block truncate mr-2">
          {{ selectedMovements.length }} selected
        </span>
        <i class="mdi mdi-close" />
      </button>
      <div class="border-r border-primary-800 h-5 w-[1px]" />

      <button
        class="inline-flex items-center justify-center transition rounded bg-primary-800 text-white hover:bg-primary-700 h-7 px-2.5"
        @click="showCreateActivities = true"
      >
        <i class="mdi mdi-plus text-base" />
        <span class="ml-1.5 font-medium text-xs"> Create activities </span>
      </button>
    </div>
  </div>

  <AddActivityModal
    v-model="showCreateActivities"
    :movements="selectedMovements"
  />
</template>
