<script setup lang="ts">
import { ActivityType } from "@maille/core/activities";

import ActivityTypeSection from "@/containers/settings/categories/ActivityTypeSection.vue";
</script>

<template>
  <div class="w-full">
    <div class="max-w-screen-md mx-auto my-16 px-8">
      <div class="text-primary-200 font-medium text-3xl pb-3">Categories</div>
      <div class="text-primary-500 border-b pb-6 text-sm font-medium">
        Manage your differents activity categories and subcategories.
      </div>

      <div class="text-sm text-primary-500 mt-5 leading-normal mb-10">
        Categories and subcategories help you group your financial activities by
        subject, allowing you to analyse and forecast your periods.
      </div>

      <ActivityTypeSection
        v-for="activityType in [
          ActivityType.EXPENSE,
          ActivityType.REVENUE,
          ActivityType.INVESTMENT,
          ActivityType.NEUTRAL,
        ]"
        :key="activityType"
        :activity-type="activityType"
      />
    </div>
  </div>
</template>
