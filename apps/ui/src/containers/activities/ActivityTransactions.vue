<script setup lang="ts">
import { computed, ref } from "vue";

import type { Activity, Transaction } from "@maille/core/activities";

import AddTransactionButton from "@/containers/activities/AddTransactionButton.vue";

import AccountSelect from "@/components/accounts/AccountSelect.vue";
import TAmountInput from "@/components/designSystem/TAmountInput.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import { useActivitiesStore } from "@/stores/activities";
import { useEventsStore } from "@/stores/events";
import {
  deleteTransactionMutation,
  updateTransactionMutation,
} from "@/mutations/activities";

const activitiesStore = useActivitiesStore();
const eventsStore = useEventsStore();

const props = defineProps<{
  activity: Activity;
}>();

const showTransactions = ref(true);

const transactionsSum = computed(() => {
  return props.activity.transactions.reduce((s, t) => s + t.amount, 0);
});

const handleTransactionUpdate = (
  transaction: Transaction,
  updateData: Partial<Transaction>,
) => {
  const oldTransaction = { ...transaction };
  activitiesStore.updateTransaction(
    props.activity.id,
    transaction.id,
    updateData,
  );

  eventsStore.sendEvent({
    name: "updateTransaction",
    mutation: updateTransactionMutation,
    variables: {
      activityId: props.activity.id,
      id: transaction.id,
      ...updateData,
    },
    rollbackData: oldTransaction,
  });
};

const handleTransactionMenuClick = (
  transaction: Transaction,
  event: string,
) => {
  if (event === "delete") {
    activitiesStore.deleteTransaction(props.activity.id, transaction.id);

    eventsStore.sendEvent({
      name: "deleteTransaction",
      mutation: deleteTransactionMutation,
      variables: {
        activityId: props.activity.id,
        id: transaction.id,
      },
      rollbackData: transaction,
    });
  }
};
</script>

<template>
  <div class="border-b py-6 px-4 sm:px-8">
    <div class="flex items-center">
      <div
        class="-ml-2 text-sm font-medium text-primary-100 px-2 rounded h-7 hover:text-white flex items-center"
        @click="showTransactions = !showTransactions"
      >
        Transactions
        <i
          class="mdi ml-2"
          :class="showTransactions ? 'mdi-menu-down' : 'mdi-menu-up'"
        />
      </div>

      <div class="flex-1" />

      <template v-if="showTransactions">
        <div
          v-if="transactionsSum !== undefined"
          class="text-sm whitespace-nowrap mr-4 text-primary-100 font-mono"
        >
          {{ getCurrencyFormatter().format(transactionsSum) }}
        </div>
        <AddTransactionButton :activity="activity" />
      </template>
    </div>

    <div
      v-show="showTransactions"
      class="mt-4 mb-2 bg-primary-800 -mx-4 rounded border"
    >
      <template
        v-for="(transaction, index) in activity.transactions"
        :key="transaction.id"
      >
        <div
          class="h-10 flex items-center justify-center text-sm hover:bg-primary-700 px-4"
          :class="[index !== activity.transactions.length - 1 && 'border-b']"
        >
          <AccountSelect
            :model-value="transaction.fromAccount"
            borderless
            class="pl-0"
            @update:model-value="
              (account) =>
                handleTransactionUpdate(transaction, {
                  fromAccount: account,
                })
            "
          />
          <div class="mx-2 text-center text-primary-200">to</div>
          <AccountSelect
            :model-value="transaction.toAccount"
            borderless
            @update:model-value="
              (account) =>
                handleTransactionUpdate(transaction, { toAccount: account })
            "
          />

          <div class="flex-1" />

          <TAmountInput
            :model-value="transaction.amount"
            borderless
            class="mr-4"
            @update:model-value="
              (amount) => handleTransactionUpdate(transaction, { amount })
            "
          />

          <TMenu
            :items="[{ value: 'delete', text: 'Delete', icon: 'delete' }]"
            @click:item="handleTransactionMenuClick(transaction, $event)"
          />
        </div>
      </template>
      <div
        v-if="activity.transactions!.length === 0"
        class="text-sm text-primary-300 p-4"
      >
        No transaction added for this activity.
      </div>
    </div>
  </div>
</template>
