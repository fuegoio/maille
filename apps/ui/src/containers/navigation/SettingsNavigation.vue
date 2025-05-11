<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

import { useSettingsStore } from "@/stores/settings";

const { previousRoute } = storeToRefs(useSettingsStore());

const props = defineProps<{
  openMobile: boolean;
}>();
const emit = defineEmits(["close"]);

const route = useRoute();
const router = useRouter();

const goBack = () => {
  if (previousRoute.value) {
    router.push(previousRoute.value);
    previousRoute.value = undefined;
  } else {
    router.push("/");
  }
};
</script>

<template>
  <div class="flex items-center mt-12 lg:mt-2 h-14">
    <div
      type="button"
      class="inline-flex items-center justify-center w-6 h-8 mr-3"
      @click="goBack"
    >
      <i
        class="mdi mdi-chevron-left mdi-24px transition text-primary-600 hover:text-primary-100"
      />
    </div>

    <div class="text-primary-300 font-medium text-lg">Settings</div>
  </div>

  <div class="mt-4">
    <RouterLink
      class="flex items-center hover:bg-primary-600 rounded px-2 h-8 group transition-colors my-1 mb-4"
      :to="{ name: 'settings' }"
      :class="{
        'bg-primary-900': route.name === 'settings',
      }"
      @click="emit('close')"
    >
      <span class="text-sm ml-7 text-primary-300 font-medium">Overview</span>
    </RouterLink>

    <RouterLink
      class="flex items-center hover:bg-primary-600 rounded px-2 h-8 group transition-colors my-1"
      :to="{ name: 'settings_profile' }"
      :class="{
        'bg-primary-900': route.name === 'settings_profile',
      }"
      @click="emit('close')"
    >
      <i
        class="mdi mdi-account text-primary-500 group-hover:text-primary-300 transition-colors"
      />
      <span class="text-sm ml-3 text-primary-300 font-medium">Profile</span>
    </RouterLink>

    <RouterLink
      class="flex items-center hover:bg-primary-600 rounded px-2 h-8 group transition-colors my-1"
      :to="{ name: 'settings_users' }"
      :class="{
        'bg-primary-900': route.name === 'settings_users',
      }"
      @click="emit('close')"
    >
      <i
        class="mdi mdi-account-group text-primary-500 group-hover:text-primary-300 transition-colors"
      />
      <span class="text-sm ml-3 text-primary-300 font-medium">Users</span>
    </RouterLink>

    <RouterLink
      class="flex items-center hover:bg-primary-600 rounded px-2 h-8 group transition-colors my-1"
      :to="{ name: 'settings_accounts' }"
      :class="{
        'bg-primary-900': route.name === 'settings_accounts',
      }"
      @click="emit('close')"
    >
      <i
        class="mdi mdi-bank text-primary-500 group-hover:text-primary-300 transition-colors"
      />
      <span class="text-sm ml-3 text-primary-300 font-medium">Accounts</span>
    </RouterLink>
    <RouterLink
      class="flex items-center hover:bg-primary-600 rounded px-2 h-8 group transition-colors my-1"
      :to="{ name: 'settings_categories' }"
      :class="{
        'bg-primary-900': route.name === 'settings_categories',
      }"
      @click="emit('close')"
    >
      <i
        class="mdi mdi-tag text-primary-500 group-hover:text-primary-300 transition-colors"
      />
      <span class="text-sm ml-3 text-primary-300 font-medium">Categories</span>
    </RouterLink>
  </div>
</template>
