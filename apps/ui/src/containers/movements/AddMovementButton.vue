<script setup lang="ts">
import { ref } from "vue";
import type dayjs from "dayjs";

import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";

import AccountSelect from "@/components/accounts/AccountSelect.vue";

import { useMovementsStore } from "@/stores/movements";
import { useEventsStore } from "@/stores/events";
import type { UUID } from "crypto";
import { createMovementMutation } from "@/mutations/movements";
import { useHotkey } from "@/hooks/use-hotkey";


defineOptions({ inheritAttrs: false });

const movementsStore = useMovementsStore();
const eventsStore = useEventsStore();

const addNewMovementDialog = ref({
  show: false,
  date: undefined as dayjs.Dayjs | undefined,
  amount: undefined as number | undefined,
  account: undefined as UUID | undefined,
  name: undefined as string | undefined,
});

const resetAddNewMovementDialog = () => {
  addNewMovementDialog.value = {
    show: false,
    date: undefined,
    amount: undefined,
    account: undefined,
    name: undefined,
  };
};

const addNewMovement = async () => {
  if (addNewMovementDialog.value.amount === undefined) return;
  else if (addNewMovementDialog.value.date === undefined) return;
  else if (addNewMovementDialog.value.account === undefined) return;
  else if (addNewMovementDialog.value.name === undefined) return;

  const movement = movementsStore.addNewMovement(
    addNewMovementDialog.value.date,
    addNewMovementDialog.value.amount,
    addNewMovementDialog.value.account,
    addNewMovementDialog.value.name,
  );

  eventsStore.sendEvent({
    name: "createMovement",
    mutation: createMovementMutation,
    variables: {
      id: movement.id,
      name: movement.name,
      date: movement.date.format("YYYY-MM-DD"),
      account: movement.account,
      amount: movement.amount,
    },
    rollbackData: undefined,
  });

  resetAddNewMovementDialog();
};

const open = () => {
  addNewMovementDialog.value.show = true;
};

useHotkey(["c"], () => {
  open();
});
</script>

<template>
  <TTooltip text="Add a new movement">
    <button
      v-bind="$attrs"
      type="button"
      class="inline-flex items-center justify-center transition text-primary-100 hover:text-white bg-primary-700 hover:bg-primary-600 border rounded px-1.5 h-7"
      @click="open"
    >
      <i class="mdi mdi-plus text-base" />
    </button>
  </TTooltip>

  <TransitionRoot appear :show="addNewMovementDialog.show" as="template">
    <Dialog as="div" class="relative z-50" @close="resetAddNewMovementDialog">
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
                <div class="text-white font-medium">Add a new movement</div>
                <div class="flex-1" />
                <button
                  class="inline-flex items-center justify-center w-6 h-6 transition text-primary-500 hover:text-primary-100 min-w-6 shrink-0"
                  @click="resetAddNewMovementDialog"
                >
                  <i class="mdi mdi-close text-lg" />
                </button>
              </DialogTitle>

              <div class="px-8 py-6">
                <div class="flex flex-col sm:flex-row sm:items-center text-sm">
                  <div class="text-sm text-primary-100">Date</div>
                  <div class="flex-1" />
                  <TDatePicker
                    v-model="addNewMovementDialog.date"
                    class="w-full sm:w-56 mt-2 sm:mt-0 text-white"
                  />
                </div>

                <div
                  class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                >
                  <div class="text-sm text-primary-100">Amount</div>
                  <div class="flex-1" />
                  <TAmountInput
                    v-model="addNewMovementDialog.amount"
                    class="w-full sm:w-56 mt-2 sm:mt-0"
                  />
                </div>

                <div
                  class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                >
                  <div class="text-sm text-primary-100">Account</div>
                  <div class="flex-1" />
                  <AccountSelect
                    v-model="addNewMovementDialog.account"
                    movements-only
                    class="w-full sm:w-56 mt-2 sm:mt-0"
                  />
                </div>

                <div
                  class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                >
                  <div class="text-sm text-primary-100">Name</div>
                  <div class="flex-1" />
                  <TTextField
                    v-model="addNewMovementDialog.name"
                    placeholder="Restaurant"
                    class="w-full sm:w-56 mt-2 sm:mt-0"
                  />
                </div>
              </div>

              <div class="border-t px-8 py-4 flex justify-end">
                <TBtn @click="addNewMovement"> Create movement </TBtn>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
