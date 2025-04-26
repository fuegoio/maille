<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    icon?: string;
    outlined?: boolean;
    disabled?: boolean;
    large?: boolean;
    danger?: boolean;
  }>(),
  {
    icon: undefined,
    outlined: false,
    disabled: false,
    large: false,
    danger: false,
  },
);

const classes = computed(() => {
  const classes = [];

  // Size
  classes.push(props.large ? "h-10" : "h-8");

  // Color
  if (!props.disabled) {
    if (props.danger) {
      classes.push("bg-red-400 hover:bg-red-300");
    } else if (props.outlined) {
      classes.push("bg-primary-700 hover:bg-primary-600 text-white");
    } else {
      classes.push("bg-primary-500 hover:bg-primary-400");
    }

    classes.push(
      props.outlined ? "border text-primary-400" : "shadow text-white",
    );
  } else {
    classes.push("bg-primary-600 text-primary-400");
  }

  return classes;
});
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center px-3.5 transition rounded"
    :class="classes"
    :disabled="disabled"
  >
    <i v-if="icon" class="mdi text-lg mr-1.5" :class="[`mdi-${icon}`]" />
    <div class="text-sm font-medium text-center flex-1">
      <slot />
    </div>
  </button>
</template>
