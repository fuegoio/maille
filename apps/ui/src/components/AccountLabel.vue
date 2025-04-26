<script setup lang="ts">
import { useAccountsStore, ACCOUNT_TYPES_COLOR } from "@/stores/accounts";
import type { UUID } from "crypto";

import { computed } from "vue";

const accountStore = useAccountsStore();

const props = defineProps<{
  accountId: UUID;
}>();

const account = computed(() => {
  return accountStore.accounts.find((a) => a.id === props.accountId);
});
</script>

<template>
  <div v-if="account" class="flex items-center min-w-0 shrink-0">
    <div
      class="h-3 w-3 rounded-xl mr-2 sm:mr-3 shrink-0"
      :class="ACCOUNT_TYPES_COLOR[account.type]"
    />
    <div
      class="font-medium text-ellipsis whitespace-nowrap overflow-hidden text-white"
    >
      {{ account.name }}
    </div>
  </div>
</template>
