<script setup lang="ts">
import { ref } from "vue";

import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";

import AccountSelect from "@/components/accounts/AccountSelect.vue";

import type { Activity } from "@maille/core/activities";
import { useActivitiesStore } from "@/stores/activities";
import type { UUID } from "crypto";
import { useEventsStore } from "@/stores/events";
import { addTransactionMutation } from "@/mutations/activities";

const activitiesStore = useActivitiesStore();

const props = defineProps<{
  activity: Activity;
}>();

const addNewTransactionDialog = ref({
  show: false,
  amount: undefined as number | undefined,
  fromAccount: undefined as UUID | undefined,
  toAccount: undefined as UUID | undefined,
});

const resetAddNewTransactionDialog = () => {
  addNewTransactionDialog.value = {
    show: false,
    amount: undefined,
    fromAccount: undefined,
    toAccount: undefined,
  };
};

const eventsStore = useEventsStore();

const addNewTransaction = async () => {
  if (addNewTransactionDialog.value.amount === undefined) return;
  else if (addNewTransactionDialog.value.fromAccount === undefined) return;
  else if (addNewTransactionDialog.value.toAccount === undefined) return;

  const transaction = activitiesStore.addNewTransaction(
    props.activity.id,
    addNewTransactionDialog.value.amount,
    addNewTransactionDialog.value.fromAccount,
    addNewTransactionDialog.value.toAccount,
  );

  eventsStore.sendEvent({
    name: "addTransaction",
    mutation: addTransactionMutation,
    variables: {
      activityId: props.activity.id,
      ...transaction,
    },
    rollbackData: undefined,
  });

  resetAddNewTransactionDialog();
};

const open = () => {
  addNewTransactionDialog.value.show = true;
};
</script>

<template>
  <TTooltip text="Add a transaction">
    <button
      type="button"
      class="inline-flex items-center justify-center w-6 h-6 transition text-primary-100 hover:text-white bg-primary-700 hover:bg-primary-600 border rounded-md"
      @click="open"
    >
      <i class="mdi mdi-plus text-base" />
    </button>
  </TTooltip>

  <TransitionRoot appear :show="addNewTransactionDialog.show" as="template">
    <Dialog
      as="div"
      class="relative z-50"
      @close="resetAddNewTransactionDialog"
    >
      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center"
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
              class="w-full max-w-xl transform overflow-hidden rounded-lg bg-primary-800 text-left align-middle shadow-2xl transition-all border"
            >
              <DialogTitle as="div" class="flex border-b pb-4 pt-5 px-8">
                <div class="text-white font-medium">Add a new transaction</div>
                <div class="flex-1" />
                <button
                  class="inline-flex items-center justify-center w-6 h-6 transition text-primary-500 hover:text-primary-100 min-w-6 shrink-0"
                  @click="resetAddNewTransactionDialog"
                >
                  <i class="mdi mdi-close text-lg" />
                </button>
              </DialogTitle>

              <div class="px-8 py-6">
                <div class="flex flex-col sm:flex-row sm:items-center text-sm">
                  <div class="text-sm text-primary-600">Amount</div>
                  <div class="flex-1" />
                  <TAmountInput
                    v-model="addNewTransactionDialog.amount"
                    class="w-full sm:w-56 mt-2 sm:mt-0"
                  />
                </div>

                <div
                  class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                >
                  <div class="text-sm text-primary-600">From account</div>
                  <div class="flex-1" />
                  <AccountSelect
                    v-model="addNewTransactionDialog.fromAccount"
                    class="w-full sm:w-56 mt-2 sm:mt-0"
                  />
                </div>

                <div
                  class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                >
                  <div class="text-sm text-primary-600">To account</div>
                  <div class="flex-1" />
                  <AccountSelect
                    v-model="addNewTransactionDialog.toAccount"
                    class="w-full sm:w-56 mt-2 sm:mt-0"
                  />
                </div>
              </div>

              <div class="border-t px-8 py-4 flex justify-end">
                <TBtn @click="addNewTransaction"> Create transaction </TBtn>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
