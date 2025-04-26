<script setup lang="ts">
import { computed, ref } from "vue";

import { useLiabilitiesStore } from "@/stores/liabilities";

import AccountLabel from "@/components/AccountLabel.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import type { Activity } from "@maille/core/activities";

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
      <div
        v-for="(liability, index) in activityLiabilities"
        :key="liability.account"
        class="h-10 flex items-center justify-center text-sm hover:bg-primary-700 px-4"
        :class="[index !== activityLiabilities.length - 1 && 'border-b']"
      >
        <AccountLabel :account-id="liability.account" class="text-sm ml-0.5" />

        <div class="flex-1" />

        <span class="font-mono">
          {{ getCurrencyFormatter().format(liability.amount) }}
        </span>
      </div>
      <div
        v-if="activityLiabilities!.length === 0"
        class="text-sm text-primary-300 px-4 py-3"
      >
        No liability detected for this activity.
      </div>
    </div>
  </div>
</template>
