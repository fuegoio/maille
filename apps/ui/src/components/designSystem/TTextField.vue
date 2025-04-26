<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null;
    disabled?: boolean;
    appendText?: string;
    icon?: string;
    placeholder?: string;
    type?: string;
    autocomplete?: string;
    name?: string;
    autofocus?: boolean;
    dense?: boolean;
  }>(),
  {
    modelValue: null,
    disabled: false,
    appendText: undefined,
    icon: undefined,
    placeholder: undefined,
    type: undefined,
    autocomplete: undefined,
    name: undefined,
    autofocus: false,
    dense: false,
  },
);
const emit = defineEmits(["update:modelValue", "blur"]);

const value = ref<string | number | null>(props.modelValue);
const currentlyFocused = ref(false);
const input = ref();

watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  },
);

const updateValue = () => {
  emit("update:modelValue", value.value);
};

onMounted(() => {
  if (props.autofocus) {
    (input.value as HTMLInputElement).focus();
  }
});

defineExpose({ click: () => input.value.focus() });
</script>

<template>
  <div
    class="flex items-center bg-primary-700 rounded border hover:bg-primary-600 text-white transition-colors"
    :class="[
      currentlyFocused ? 'border-primary-300' : 'hover:border-primary-300',
      dense ? 'h-8 rounded' : 'h-10',
    ]"
  >
    <i v-if="icon" class="mdi pl-3 mdi-16px mt-0.5" :class="icon" />
    <input
      ref="input"
      v-model="value"
      :name="name"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      class="pl-3 text-left min-w-0 border-none h-8 text-sm bg-transparent flex-1"
      :step="type === 'number' ? 0.01 : undefined"
      @focus="currentlyFocused = true"
      @blur="
        currentlyFocused = false;
        emit('blur');
      "
      @input="updateValue"
    />
    <div v-if="appendText" class="w-6">
      {{ appendText }}
    </div>
  </div>
</template>
