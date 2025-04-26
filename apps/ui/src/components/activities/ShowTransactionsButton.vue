<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useActivitiesStore } from "@/stores/activities";

const activitiesStore = useActivitiesStore();
const { showTransactions } = storeToRefs(activitiesStore);
</script>

<template>
  <TTooltip text="Show transactions">
    <button
      type="button"
      class="inline-flex items-center justify-center transition text-primary-100 hover:text-white hover:bg-primary-800 rounded h-7 w-7"
      :class="showTransactions ? 'bg-primary-800 text-white' : 'bg-transparent'"
      @click="showTransactions = !showTransactions"
    >
      <i class="mdi mdi-list-box" />
    </button>
  </TTooltip>
</template>
