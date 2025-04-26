<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;
    isOverflowPositive: boolean;
    backgroundColor?: string;
  }>(),
  { backgroundColor: "#e2e8f0" }
);

const overflowColor = computed(() => {
  return props.isOverflowPositive ? "#34d399" : "#f87171";
});

const circumference = 7 * 2 * Math.PI;
</script>

<template>
  <svg width="16" height="16" viewBox="0 0 16 16">
    <circle
      cx="8"
      cy="8"
      r="7"
      fill="none"
      :stroke="value < 1 ? backgroundColor : overflowColor"
      stroke-width="2"
      style="transition: transform 0.6s ease 0s, stroke-dashoffset 0.6s ease 0s"
    ></circle>
    <circle
      v-if="value < 1"
      transform="rotate(-90 8 8)"
      cx="8"
      cy="8"
      r="7"
      fill="none"
      stroke="#818cf8"
      stroke-width="2"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="circumference - value * circumference"
      style="transition: all 0.6s ease 0s; stroke-linecap: round"
    ></circle>
    <circle
      v-else
      transform="rotate(135 8 8)"
      cx="8"
      cy="8"
      r="7"
      fill="none"
      stroke="url(#yellowHighlight)"
      stroke-width="2"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="circumference - 0.5 * circumference"
      style="transition: all 0.6s ease 0s; stroke-linecap: round"
    ></circle>
  </svg>
</template>
