<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import LiabilityFilterOperatorMenu from "@/components/liabilities/filters/LiabilityFilterOperatorMenu.vue";
import LiabilityFilterValueMenu from "@/components/liabilities/filters/LiabilityFilterValueMenu.vue";

import {
  LiabilityFilterFields,
  type LiabilityFilter,
} from "@maille/core/liabilities";

const props = defineProps<{
  modelValue: LiabilityFilter;
}>();
const emit = defineEmits(["update:model-value", "delete"]);

const operatorMenu = ref<InstanceType<typeof LiabilityFilterOperatorMenu>>();
const valueMenu = ref<InstanceType<typeof LiabilityFilterValueMenu>>();

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

const liabilityFilterField = computed(
  () =>
    LiabilityFilterFields.find((lff) => lff.value === props.modelValue.field)!,
);
</script>

<template>
  <div
    class="flex items-center rounded overflow-hidden h-7 border w-fit max-w-full bg-primary-800"
  >
    <div
      class="flex items-center px-2 text-sm h-7 text-white border-r font-medium"
    >
      <i class="mdi mt-0.5" :class="liabilityFilterField.icon" />
      <span class="ml-2 mr-1">
        {{ liabilityFilterField.text }}
      </span>
    </div>

    <LiabilityFilterOperatorMenu
      ref="operatorMenu"
      :model-value="modelValue.operator"
      :field="modelValue.field"
      @update:model-value="
        emit('update:model-value', { ...modelValue, operator: $event })
      "
      @close="handleCloseOperator"
    />

    <LiabilityFilterValueMenu
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