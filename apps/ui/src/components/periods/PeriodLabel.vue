<script setup lang="ts">
import { usePeriodsStore } from "@/stores/periods";
import type { Period } from "@/types/periods";
import { computed } from "vue";

const props = defineProps<{
  period: Period;
}>();

const label = computed(() => usePeriodsStore().getPeriodLabel(props.period));

const chipClass = computed(() => {
  if (label.value === "Completed")
    return "bg-primary-100 text-primary-600 border";
  else if (label.value === "Current") return "bg-primary-400 text-white";
  return "bg-primary-100 text-primary-300 border";
});
</script>

<template>
  <span class="px-2.5 py-1 text-xs rounded" :class="chipClass">
    {{ label }}
  </span>
</template>
