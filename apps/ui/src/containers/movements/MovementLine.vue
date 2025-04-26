<script lang="ts" setup>
import dayjs from "dayjs";
import { storeToRefs } from "pinia";

import AccountLabel from "@/components/AccountLabel.vue";

import { useMovementsStore } from "@/stores/movements";

import type { Movement } from "@maille/core/movements";

import { getCurrencyFormatter } from "@/utils/currency";

const props = defineProps<{
  movement: Movement;
}>();

const movementsStore = useMovementsStore();
const { focusedMovement } = storeToRefs(movementsStore);
</script>

<template>
  <div
    class="h-10 flex items-center gap-2 pr-2 sm:pr-6 border-b text-sm flex-shrink-0 transition-colors"
    :class="
      focusedMovement === movement.id
        ? 'bg-primary-800/50 border-l-4 border-l-primary-400 pl-3 sm:pl-1'
        : 'hover:bg-primary-800/50 pl-4 sm:pl-2'
    "
  >
    <div class="hidden sm:block text-primary-100 w-20 shrink-0 ml-4">
      {{ dayjs(movement.date).format("DD/MM/YYYY") }}
    </div>
    <div class="sm:hidden text-primary-100 w-10 shrink-0">
      {{ dayjs(movement.date).format("DD/MM") }}
    </div>

    <i
      v-if="movement.status === 'incomplete'"
      class="mdi mdi-progress-helper text-lg text-orange-300"
    />
    <i v-else class="mdi mdi-check-circle-outline text-lg text-emerald-300" />
    <AccountLabel :account-id="movement.account" />

    <div
      class="ml-1 text-primary-100 text-ellipsis overflow-hidden whitespace-nowrap"
    >
      {{ movement.name }}
    </div>

    <div class="flex-1" />
    <div class="text-white text-right whitespace-nowrap font-mono">
      {{ getCurrencyFormatter().format(movement.amount) }}
    </div>
  </div>
</template>
