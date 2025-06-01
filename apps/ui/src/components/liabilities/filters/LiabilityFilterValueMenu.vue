<script setup lang="ts">
import { ref, nextTick } from "vue";

import AccountSelect from "@/components/accounts/AccountSelect.vue";
import TSelect from "@/components/designSystem/TSelect.vue";
import TAmountInput from "@/components/designSystem/TAmountInput.vue";
import TTextField from "@/components/designSystem/TTextField.vue";

import { ActivityFilterDateValues } from "@maille/core/activities";
import type { LiabilityFilter } from "@maille/core/liabilities";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  modelValue: LiabilityFilter["value"] | undefined;
  field: LiabilityFilter["field"];
}>();
const emit = defineEmits(["update:model-value", "close"]);

const textValue = ref(props.modelValue);

const input = ref();

defineExpose({
  click: () => {
    if (input.value) {
      input.value.click();
    }
  },
});
</script>

<template>
  <template v-if="field === 'date'">
    <TSelect
      ref="input"
      v-slot="{ open, text }"
      :model-value="modelValue"
      :items="ActivityFilterDateValues.map((v) => ({ value: v, text: v }))"
      @update:model-value="emit('update:model-value', $event)"
      @close="emit('close')"
    >
      <button
        class="flex items-center px-2 text-sm h-7 text-primary-100 hover:text-white hover:bg-primary-700 transition-colors border-r min-w-[24px]"
        :class="{
          'bg-primary-700 text-white': open,
        }"
      >
        <span class="block truncate"> {{ text }} </span>
      </button>
    </TSelect>
  </template>
  <template v-else-if="field === 'amount'">
    <TAmountInput
      ref="input"
      borderless
      class="text-sm px-2 border-r h-7 hover:bg-primary-700 text-primary-100 hover:text-white"
      :model-value="modelValue as number"
      v-bind="$attrs"
      @update:model-value="emit('update:model-value', $event)"
      @close="emit('close')"
    />
  </template>
  <template v-else-if="field === 'name'">
    <TTextField
      ref="input"
      v-model="textValue as string | undefined"
      class="border-none min-w-0 bg-transparent hover:bg-primary-700"
      v-bind="$attrs"
      @keydown.enter="emit('update:model-value', textValue)"
      @blur="
        emit('update:model-value', textValue);
        nextTick(() => emit('close'));
      "
    />
  </template>
  <template v-if="field === 'account'">
    <AccountSelect
      ref="input"
      :model-value="modelValue"
      multiple
      borderless
      class="border-r hover:bg-primary-700"
      @update:model-value="emit('update:model-value', $event)"
      @close="emit('close')"
    />
  </template>
</template>