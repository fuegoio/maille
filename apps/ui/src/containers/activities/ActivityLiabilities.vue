<script setup lang="ts">
import { computed, ref } from "vue";

import { useLiabilitiesStore } from "@/stores/liabilities";

import type { Activity } from "@maille/core/activities";
import ActivityLiability from "./ActivityLiability.vue";

const liabilitiesStore = useLiabilitiesStore();

const props = defineProps<{ activity: Activity }>();

const showLiabilities = ref(true);

const activityLiabilities = computed(() =>
  liabilitiesStore.liabilities.filter(
    (l) => l.activity === props.activity.id && l.amount !== 0,
  ),
);
</script>
<template>
  <div class="border-b py-6 px-4 sm:px-8">
    <div class="flex items-center">
      <div
        class="-ml-2 text-sm font-medium text-primary-100 px-2 rounded h-7 hover:text-white flex items-center"
        @click="showLiabilities = !showLiabilities"
      >
        Liabilities
        <i
          class="mdi ml-2"
          :class="showLiabilities ? 'mdi-menu-down' : 'mdi-menu-up'"
        />
      </div>
    </div>

    <div
      v-show="showLiabilities"
      class="mt-4 mb-2 -mx-4 rounded border bg-primary-800"
    >
      <ActivityLiability
        v-for="(liability, index) in activityLiabilities"
        :key="liability.account"
        :liability="liability"
        :class="[index !== activityLiabilities.length - 1 && 'border-b']"
        @update:liability="
          (l) => liabilitiesStore.updateLiability(liability.id, l)
        "
      />
      <div
        v-if="activityLiabilities!.length === 0"
        class="text-sm text-primary-300 px-4 py-3"
      >
        No liability detected for this activity.
      </div>
    </div>
  </div>
</template>
