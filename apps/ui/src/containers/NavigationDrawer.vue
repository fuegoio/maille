<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";

import NormalNavigation from "@/containers/navigation/NormalNavigation.vue";
import SettingsNavigation from "@/containers/navigation/SettingsNavigation.vue";

const route = useRoute();

const openMobile = ref(false);
</script>

<template>
  <button
    class="absolute lg:hidden z-30 top-5 left-5 h-8 w-8 flex items-center justify-center"
    @click="openMobile = !openMobile"
  >
    <i class="mdi mdi-menu text-white text-xl" />
  </button>

  <div
    class="w-56 h-full absolute px-4 z-20 lg:static lg:shadow-none transition-transform duration-200 lg:translate-x-0 lg:transition-none flex flex-col overflow-y-auto min-h-0 rounded-r-lg bg-primary-900/90 backdrop-blur lg:bg-transparent lg:backdrop-blur-0 shrink-0"
    :class="{
      '-translate-x-56 ': !openMobile,
      '': openMobile,
    }"
  >
    <SettingsNavigation
      v-if="route.path.includes('settings')"
      :open-mobile="openMobile"
      @close="openMobile = false"
    />
    <NormalNavigation
      v-else
      :open-mobile="openMobile"
      @close="openMobile = false"
      @route-click="openMobile = false"
    />
  </div>
</template>
