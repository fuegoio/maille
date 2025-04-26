<script setup lang="ts">
import { ref } from "vue";

import AddAndEditProjectModal from "./AddAndEditProjectModal.vue";

import { useHotkey } from "@/hooks/use-hotkey";

const emit = defineEmits(["create"]);

const show = ref(false);

useHotkey(["c"], () => {
  show.value = true;
});
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <button
    v-bind="$attrs"
    type="button"
    class="inline-flex items-center justify-center transition border rounded flex-shrink-0 w-7 sm:w-auto sm:px-2.5 h-7 text-white bg-primary-400 hover:bg-primary-300"
    @click="show = true"
  >
    <i class="mdi mdi-plus text-base mt-0.5" />
    <span class="ml-2 font-medium text-xs hidden sm:block"> New project </span>
  </button>

  <AddAndEditProjectModal v-model="show" @create="emit('create', $event)" />
</template>
