<script setup lang="ts">
import { computed, ref } from "vue";

import { useUsersStore } from "@/stores/users";
import { useEventsStore } from "@/stores/events";

import AccountLabel from "@/components/AccountLabel.vue";
import TSelect from "@/components/designSystem/TSelect.vue";

import { getCurrencyFormatter } from "@/utils/currency";
import { updateLiabilityMutation } from "@/mutations/liabilities";

import type { Liability } from "@maille/core/liabilities";
import type { UUID } from "crypto";

const usersStore = useUsersStore();
const eventsStore = useEventsStore();

const props = defineProps<{ liability: Liability }>();
const emit = defineEmits<{
  (e: "update:liability", liability: Liability): void;
}>();

// Create options for party selection
const partyOptions = computed(() => {
  const userOptions = usersStore.users.map((user) => ({
    value: user.id,
    text: `${user.firstName} ${user.lastName}`,
  }));

  return [
    { value: "", text: "Select a user..." },
    ...userOptions,
    {
      value: "custom",
      text: "Custom",
    },
  ];
});

const handleUserSelection = (selectedUserId: UUID | "" | "custom") => {
  if (selectedUserId === "custom") {
    showCustomPartyInput.value = true;
    return;
  }

  const liability = { ...props.liability };

  if (selectedUserId === "") {
    // Clear selection
    liability.otherUser = null;
    liability.other = null;
    showCustomPartyInput.value = false;
  } else {
    // Set selected user
    liability.otherUser = selectedUserId;
    liability.other = null;
  }

  emit("update:liability", liability);

  // Send mutation
  eventsStore.sendEvent({
    name: "updateLiability",
    mutation: updateLiabilityMutation,
    variables: {
      id: liability.id,
      other: liability.other,
      otherUser: liability.otherUser,
    },
    rollbackData: props.liability,
  });
};

const showCustomPartyInput = ref(props.liability.other !== null);
const handleCustomPartyInput = (customValue: string) => {
  const liability = { ...props.liability };

  liability.other = customValue;
  liability.otherUser = null;

  emit("update:liability", liability);

  // Send mutation
  eventsStore.sendEvent({
    name: "updateLiability",
    mutation: updateLiabilityMutation,
    variables: {
      id: liability.id,
      other: liability.other,
      otherUser: liability.otherUser,
    },
    rollbackData: props.liability,
  });
};
</script>

<template>
  <div class="flex items-center text-sm hover:bg-primary-700 px-4 py-3">
    <div class="flex flex-col flex-1 space-y-2">
      <div class="flex items-center">
        <AccountLabel :account-id="liability.account" class="text-sm ml-0.5" />
        <div class="mx-2 text-center text-primary-200">with</div>
        <TSelect
          v-if="!showCustomPartyInput"
          :model-value="liability.otherUser || ''"
          :items="partyOptions"
          placeholder="Select a user..."
          class="text-xs border-none h-6"
          @update:model-value="(value) => handleUserSelection(value)"
        />
        <TTextField
          v-else
          :model-value="liability.other"
          class="text-xs border-none h-6"
          @update:model-value="(value) => handleCustomPartyInput(value)"
          @keydown.esc.stop="() => handleUserSelection('')"
        />

        <div class="flex-1" />
        <span class="font-mono">
          {{ getCurrencyFormatter().format(liability.amount) }}
        </span>
      </div>
    </div>
  </div>
</template>
