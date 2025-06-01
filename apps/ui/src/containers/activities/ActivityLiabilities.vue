<script setup lang="ts">
import { computed, ref } from "vue";

import { useLiabilitiesStore } from "@/stores/liabilities";
import { useUsersStore } from "@/stores/users";
import { useEventsStore } from "@/stores/events";

import AccountLabel from "@/components/AccountLabel.vue";
import TSelect from "@/components/designSystem/TSelect.vue";

import { getCurrencyFormatter } from "@/utils/currency";
import { updateLiabilityMutation } from "@/mutations/liabilities";

import type { Activity } from "@maille/core/activities";
import type { Liability } from "@maille/core/liabilities";
import type { UUID } from "crypto";

const liabilitiesStore = useLiabilitiesStore();
const usersStore = useUsersStore();
const eventsStore = useEventsStore();

const props = defineProps<{ activity: Activity }>();

const showLiabilities = ref(true);

const activityLiabilities = computed(() =>
  liabilitiesStore.liabilities.filter(
    (l) => l.activity === props.activity.id && l.amount !== 0,
  ),
);

// Create options for party selection
const partyOptions = computed(() => {
  const userOptions = usersStore.users.map((user) => ({
    value: user.id,
    text: `${user.firstName} ${user.lastName}`,
  }));
  
  return [
    { value: '', text: 'Select a user...' },
    ...userOptions,
  ];
});

const getPartyDisplayValue = (liability: Liability) => {
  if (liability.other_user) {
    const user = usersStore.getUserById(liability.other_user);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  }
  return liability.other || 'No party assigned';
};

const handleUserSelection = (liability: Liability, selectedUserId: UUID | '') => {
  const originalLiability = { ...liability };
  
  if (selectedUserId === '') {
    // Clear selection
    liability.other_user = null;
    liability.other = null;
  } else {
    // Set selected user
    liability.other_user = selectedUserId;
    liability.other = null;
  }
  
  // Send mutation
  eventsStore.sendEvent({
    name: "updateLiability",
    mutation: updateLiabilityMutation,
    variables: {
      id: liability.id,
      other: liability.other,
      other_user: liability.other_user,
    },
    rollbackData: originalLiability,
  });
};

const handleCustomPartyInput = (liability: Liability, customValue: string) => {
  const originalLiability = { ...liability };
  
  liability.other = customValue;
  liability.other_user = null;
  
  // Send mutation
  eventsStore.sendEvent({
    name: "updateLiability",
    mutation: updateLiabilityMutation,
    variables: {
      id: liability.id,
      other: liability.other,
      other_user: liability.other_user,
    },
    rollbackData: originalLiability,
  });
};
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
        class="flex items-center text-sm hover:bg-primary-700 px-4 py-3"
        :class="[index !== activityLiabilities.length - 1 && 'border-b']"
      >
        <div class="flex flex-col flex-1 space-y-2">
          <div class="flex items-center">
            <AccountLabel :account-id="liability.account" class="text-sm ml-0.5" />
            <div class="flex-1" />
            <span class="font-mono">
              {{ getCurrencyFormatter().format(liability.amount) }}
            </span>
          </div>
          
          <div class="flex flex-col space-y-1">
            <div class="flex items-center space-x-2">
              <span class="text-xs text-primary-300 min-w-0 flex-shrink-0">User:</span>
              <div class="flex-1 min-w-0">
                <TSelect
                  :model-value="liability.other_user || ''"
                  :items="partyOptions"
                  placeholder="Select a user..."
                  class="text-xs"
                  @update:model-value="(value) => handleUserSelection(liability, value)"
                />
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xs text-primary-300 min-w-0 flex-shrink-0">Or custom:</span>
              <div class="flex-1 min-w-0">
                <input
                  :value="liability.other || ''"
                  type="text"
                  placeholder="Enter custom party name..."
                  class="w-full px-2 py-1 text-xs bg-primary-700 border border-primary-600 rounded focus:outline-none focus:border-primary-500"
                  @input="(e) => handleCustomPartyInput(liability, (e.target as HTMLInputElement).value)"
                />
              </div>
            </div>
            <div v-if="liability.other_user || liability.other" class="text-xs text-primary-400">
              Current: {{ getPartyDisplayValue(liability) }}
            </div>
          </div>
        </div>
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
