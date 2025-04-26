<script setup lang="ts">
import { storeToRefs } from "pinia";
import { onUnmounted, ref } from "vue";

import { useSearchStore } from "@/stores/search";

import { useHotkey } from "@/hooks/use-hotkey";

const { search } = storeToRefs(useSearchStore());

const show = ref(false);

useHotkey(["Ctrl", "f"], () => {
  show.value = true;
});

onUnmounted(() => {
  clear();
});

const blurInput = () => {
  if (search.value === "") {
    clear();
  }
};

const clear = () => {
  search.value = "";
  show.value = false;
};
</script>

<template>
  <transition name="fade" mode="out-in">
    <div
      v-if="show"
      class="px-4 h-14 flex items-center border-b"
    >
      <TTextField
        v-model="search"
        autofocus
        icon="mdi-magnify"
        dense
        placeholder="Find in view ..."
        @blur="blurInput"
        @keydown.escape="clear"
      />
    </div>
  </transition>
</template>
