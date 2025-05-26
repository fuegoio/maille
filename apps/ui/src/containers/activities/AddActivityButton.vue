<script setup lang="ts">
import { ref } from "vue";

import AddActivityModal from "./AddActivityModal.vue";

import { useHotkey } from "@/hooks/use-hotkey";

import type { Movement } from "@maille/core/movements";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    movement?: Movement;
    large?: boolean;
  }>(),
  { large: false, movement: undefined },
);

const show = ref(false);

useHotkey(["c"], () => {
  show.value = true;
});
</script>



<template>
  <button
    v-bind="$attrs"
    type="button"
    class="inline-flex items-center justify-center transition border rounded flex-shrink-0 text-white bg-primary-600 hover:bg-primary-300"
    :class="[large ? 'px-3.5 h-8' : 'w-7 sm:w-auto sm:px-2.5 h-7']"
    @click="show = true"
  >
    <i class="mdi mdi-plus text-base" />
    <span
      class="ml-2 font-medium"
      :class="large ? 'text-sm' : 'text-xs hidden sm:block'"
    >
      New activity
    </span>
  </button>

  <AddActivityModal v-model="show" :movement="movement" />
</template>
