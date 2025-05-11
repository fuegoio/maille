<script setup lang="ts">
import { useAccountsStore, ACCOUNT_TYPES_COLOR } from "@/stores/accounts";
import type { UUID } from "crypto";

import { computed } from "vue";
import UserAvatar from "./users/UserAvatar.vue";

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
    <UserAvatar
      v-if="account.user"
      :user-id="account.user"
      class="size-4 text-[0.5rem] outline outline-primary-800"
    />
    <div
      class="size-4 rounded-xl mr-2 sm:mr-3 shrink-0 -ml-1 outline outline-primary-800"
      :class="ACCOUNT_TYPES_COLOR[account.type]"
    />
    <div
      class="font-medium text-ellipsis whitespace-nowrap overflow-hidden text-white"
    >
      {{ account.name }}
    </div>
  </div>
</template>
