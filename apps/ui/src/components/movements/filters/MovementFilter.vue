<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import MovementFilterOperatorMenu from "@/components/movements/filters/MovementFilterOperatorMenu.vue";
import MovementFilterValueMenu from "@/components/movements/filters/MovementFilterValueMenu.vue";

import {
  MovementFilterFields,
  OperatorsWithoutValue,
  type MovementFilter,
} from "@maille/core/movements";

const props = defineProps<{
  modelValue: MovementFilter;
}>();
const emit = defineEmits(["update:model-value", "delete"]);

const operatorMenu = ref<InstanceType<typeof MovementFilterOperatorMenu>>();
const valueMenu = ref<InstanceType<typeof MovementFilterValueMenu>>();

onMounted(() => {
  if (props.modelValue.operator === undefined) {
    operatorMenu.value!.click();
  } else if (props.modelValue.value === undefined) {
    if (valueMenu.value) {
      valueMenu.value.click();
    }
  }
});

watch(
  () => props.modelValue.operator,
  () => {
    if (props.modelValue.value === undefined) {
      nextTick(() => {
        if (valueMenu.value) {
          valueMenu.value.click();
        }
      });
    }
  },
);

const handleCloseOperator = () => {
  if (props.modelValue.operator === undefined) {
    emit("delete");
  }
};

const handleCloseValue = () => {
  if (
    props.modelValue.value === undefined ||
    (Array.isArray(props.modelValue.value) &&
      props.modelValue.value.length === 0)
  ) {
    emit("delete");
  }
};

const movementFilterField = computed(
  () =>
    MovementFilterFields.find((mff) => mff.value === props.modelValue.field)!,
);
</script>

<template>
  <div
    class="flex items-center rounded overflow-hidden h-7 border w-fit max-w-full bg-primary-800"
  >
    <div
      class="flex items-center px-2 text-sm h-7 text-white border-r font-medium"
    >
      <i class="mdi mt-0.5" :class="movementFilterField.icon" />
      <span class="ml-2 mr-1">
        {{ movementFilterField.text }}
      </span>
    </div>

    <MovementFilterOperatorMenu
      ref="operatorMenu"
      :model-value="modelValue.operator"
      :field="modelValue.field"
      @update:model-value="
        emit('update:model-value', { ...modelValue, operator: $event })
      "
      @close="handleCloseOperator"
    />

    <MovementFilterValueMenu
      v-if="modelValue.operator !== undefined"
      ref="valueMenu"
      :model-value="modelValue.value"
      :field="modelValue.field"
      @update:model-value="
        emit('update:model-value', { ...modelValue, value: $event })
      "
      @close="handleCloseValue"
    />

    <button
      class="flex items-center justify-center text-md w-7 h-7 hover:text-white hover:bg-primary-700 transition-colors shrink-0"
      @click="emit('delete')"
    >
      <i class="mdi mdi-close mt-0.5" />
    </button>
  </div>
</template>