<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const { user } = useAuthStore();
</script>

<template>
  <div class="h-full w-full flex flex-col p-8">
    <div class="w-full flex items-center">
      <div v-if="user">
        <div class="text-sm text-primary-400">Logged in as:</div>
        <div class="text-sm text-primary-200 mt-1 font-medium">
          {{ user.email }}
        </div>
      </div>
      <div class="flex-1" />
      <RouterLink
        type="button"
        class="inline-flex items-center justify-center transition text-primary-100 hover:text-white bg-primary-700 hover:bg-primary-600 rounded px-3 h-10"
        to="/"
      >
        <i class="mdi mdi-arrow-left text-base" />
        <span class="ml-2 font-medium text-xs mb-0.5"> Go back to Maille </span>
      </RouterLink>
    </div>
    <div class="flex-1 flex flex-col items-center justify-center">
      <div class="text-7xl font-medium text-primary-100">404</div>
      <div class="text-2xl font-medium text-primary-200 mt-4">
        This page does not exist
      </div>
    </div>
  </div>
</template>
