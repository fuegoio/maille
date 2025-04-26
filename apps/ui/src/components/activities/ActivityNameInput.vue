<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useResizeObserver } from "@vueuse/core";

const props = defineProps<{
  modelValue: string | undefined;
  autofocus?: boolean;
}>();
const emits = defineEmits(["update:modelValue"]);

const input = ref<HTMLInputElement>();
const value = ref(props.modelValue);

watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  },
);

const handleInput = () => {
  if (input.value) {
    emits("update:modelValue", input.value.value);
    resizeInput();
  }
};

const resizeInput = () => {
  if (input.value) {
    input.value.style.height = "";
    input.value.style.height = input.value.scrollHeight + "px";
  }
};

useResizeObserver(input, resizeInput);

onMounted(() => {
  if (props.autofocus) {
    input.value?.focus();
  }
});
</script>

<template>
  <textarea
    ref="input"
    v-model="value"
    name="activity-name"
    rows="1"
    autocomplete="on"
    class="text-3xl text-white font-bold w-full break-words resize-none bg-transparent leading-snug placeholder:text-primary-600"
    placeholder="Activity name"
    @input="handleInput"
  />
</template>
