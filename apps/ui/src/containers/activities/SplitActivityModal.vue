<script setup lang="ts">
import { computed, ref, watch } from "vue";
import _ from "lodash";
import { useStorage } from "@vueuse/core";
import type { UUID } from "crypto";

import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
} from "@headlessui/vue";

import AccountSelect from "@/components/accounts/AccountSelect.vue";
import AccountLabel from "@/components/AccountLabel.vue";

import { useActivitiesStore } from "@/stores/activities";

import { getCurrencyFormatter } from "@/utils/currency";

import { useEventsStore } from "@/stores/events";
import {
  addTransactionMutation,
  updateTransactionMutation,
} from "@/mutations/activities";

const activitiesStore = useActivitiesStore();
const eventsStore = useEventsStore();

const props = defineProps<{
  modelValue: boolean;
  activityId: UUID;
}>();
const emit = defineEmits(["update:modelValue"]);

watch(
  () => props.modelValue,
  (value: boolean) => {
    if (value) {
      show.value = true;
    } else {
      close();
    }
  },
);

const show = ref(false);
const splitConfig = useStorage("splitConfig", {
  newAccountId: undefined as UUID | undefined,
  ratio: 0.5,
});

const validForm = computed(() => {
  return splitConfig.value.newAccountId !== undefined;
});

const activity = computed(() => {
  return activitiesStore.getActivityById(props.activityId)!;
});

const splitActivity = () => {
  if (splitConfig.value.newAccountId === undefined) return;

  activity.value.transactions.forEach((transaction) => {
    const oldTransaction = { ...transaction };
    const newTransaction = activitiesStore.addNewTransaction(
      activity.value.id,
      _.round(transaction.amount * (1 - splitConfig.value.ratio), 2),
      transaction.fromAccount,
      splitConfig.value.newAccountId!,
    );

    eventsStore.sendEvent({
      name: "addTransaction",
      mutation: addTransactionMutation,
      variables: {
        activityId: activity.value.id,
        ...newTransaction,
      },
      rollbackData: undefined,
    });

    const updatedTransaction = activitiesStore.updateTransaction(
      activity.value.id,
      transaction.id,
      {
        amount: _.round(transaction.amount * splitConfig.value.ratio, 2),
      },
    );

    eventsStore.sendEvent({
      name: "updateTransaction",
      mutation: updateTransactionMutation,
      variables: {
        activityId: activity.value.id,
        id: transaction.id,
        amount: updatedTransaction.amount,
      },
      rollbackData: oldTransaction,
    });
  });

  close();
};

const close = () => {
  show.value = false;

  emit("update:modelValue", false);
};
</script>

<template>
  <TransitionRoot appear :show="show" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-start sm:items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-100 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-2xl transform overflow-hidden rounded-lg bg-primary-800 text-left align-middle shadow-2xl transition-all border"
            >
              <div class="px-4 sm:px-8 pt-4 flex items-center">
                <div class="flex min-w-0">
                  <div
                    class="text-sm px-2 h-6 flex items-center bg-primary-300 rounded min-w-0 text-white font-medium"
                  >
                    <span class="truncate min-w-0">
                      Split activity #{{ activity.number }}
                    </span>
                    <span class="px-2">-</span>
                    <span class="truncate min-w-0">
                      {{ activity.name }}
                    </span>
                  </div>
                </div>

                <div class="flex-1" />
                <button
                  class="inline-flex items-center justify-center w-6 h-6 transition text-primary-500 hover:text-primary-100 min-w-6 shrink-0"
                  @click="close"
                >
                  <i class="mdi mdi-close text-lg" />
                </button>
              </div>

              <div class="py-4 px-4 sm:px-8">
                <div
                  class="text-sm text-white p-2 bg-primary-700 border rounded mb-4"
                >
                  Splitting an activity means that we will split each
                  transaction going to the account on the top into a new
                  transaction going to the account on the bottom.
                </div>

                <div
                  v-for="transaction in activity.transactions"
                  :key="transaction.id"
                  class="sm:flex items-center py-4 border-t"
                >
                  <div class="flex items-center text-sm px-1">
                    <AccountLabel :account-id="transaction.fromAccount" />
                  </div>

                  <div class="hidden sm:block border-b ml-3 w-10" />
                  <div
                    class="hidden sm:block flex-1 mr-3 border-b border-l border-t h-14"
                  />

                  <div class="mt-5 sm:mt-0">
                    <div class="flex items-center">
                      <TTextField
                        v-model="splitConfig.ratio"
                        type="number"
                        class="mr-2 w-14"
                      />
                      <AccountLabel
                        :account-id="transaction.toAccount"
                        class="flex-1 text-sm px-3"
                      />
                      <span
                        class="text-sm text-primary-100 ml-3 pl-3 border-l w-20 text-right font-mono"
                      >
                        {{
                          getCurrencyFormatter().format(
                            transaction.amount * splitConfig.ratio,
                          )
                        }}
                      </span>
                    </div>

                    <div class="mt-4 flex items-center">
                      <TTextField
                        :model-value="_.round(1 - splitConfig.ratio, 2)"
                        type="number"
                        class="mr-2 w-14"
                        @update:model-value="
                          splitConfig.ratio = _.round(1 - $event, 2)
                        "
                      />
                      <AccountSelect
                        v-model="splitConfig.newAccountId"
                        class="flex-1"
                      />
                      <span
                        class="text-sm text-primary-100 ml-3 pl-3 border-l w-20 text-right font-mono"
                      >
                        {{
                          getCurrencyFormatter().format(
                            transaction.amount * (1 - splitConfig.ratio),
                          )
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="border-t px-4 sm:px-8 py-4 flex justify-end">
                <TBtn outlined class="mr-3" @click="close"> Cancel </TBtn>
                <TBtn :disabled="!validForm" @click="splitActivity">
                  Split activity
                </TBtn>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
