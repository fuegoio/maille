<script setup lang="ts">
import { computed, ref } from "vue";

import {
  ActivityFilterAmountOperators,
  ActivityFilterDateOperators,
  ActivityFilterNameDescriptionOperators,
  ActivityFilterMultipleOperators,
} from "@maille/core/activities";
import type { MovementFilter } from "@maille/core/movements";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  modelValue: MovementFilter["operator"] | undefined;
  field: MovementFilter["field"];
}>();
const emit = defineEmits(["update:model-value", "close"]);

const operators = computed<readonly string[]>(() => {
  if (props.field === "date") return ActivityFilterDateOperators;
  else if (props.field === "name") return ActivityFilterNameDescriptionOperators;
  else if (props.field === "amount") return ActivityFilterAmountOperators;
  else if (props.field === "account" || props.field === "status")
    return ActivityFilterMultipleOperators;
  return [];
});

const select = ref();
defineExpose({ click: () => select.value.click() });
</script>

<template>
  <TSelect
    ref="select"
    v-slot="{ open, text }"
    :model-value="modelValue"
    :items="operators.map((o) => ({ value: o, text: o }))"
    @update:model-value="emit('update:model-value', $event)"
    @close="emit('close')"
  >
    <button
      class="flex items-center px-2 text-sm h-7 text-primary-100 hover:text-white hover:bg-primary-700 transition-colors border-r min-w-[24px] shrink-0"
      :class="{
        'bg-primary-700 text-white': open,
      }"
    >
      <span class="block truncate"> {{ text }} </span>
    </button>
  </TSelect>
</template>