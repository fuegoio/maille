<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import _ from "lodash";
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
} from "@headlessui/vue";
import type { UUID } from "crypto";

import AccountLabel from "@/components/AccountLabel.vue";

import { useMovementsStore } from "@/stores/movements";

import { getActivityTransactionsSumByAccount } from "@maille/core/activities";

import { searchCompare } from "@/utils/strings";
import { getCurrencyFormatter } from "@/utils/currency";

import type { Movement } from "@maille/core/movements";
import type { Activity } from "@maille/core/activities";
import { useAccountsStore } from "@/stores/accounts";
import { useEventsStore } from "@/stores/events";
import { createMovementActivityMutation } from "@/mutations/movements";

const props = defineProps<{
  activity: Activity;
  account: UUID;
}>();

const movementsStore = useMovementsStore();
const { movements } = storeToRefs(movementsStore);

const eventsStore = useEventsStore();

const accountsStore = useAccountsStore();
const { accounts } = storeToRefs(accountsStore);

const linkMovementDialog = ref({
  show: false,
  search: "",
  filterAmount: true,
  movement: undefined as number | undefined,
});

const filteredMovements = computed(() => {
  const transactionsSumByAccount = getActivityTransactionsSumByAccount(
    props.activity.transactions,
    accounts.value,
  );
  const transactionsSumOfAccount = transactionsSumByAccount.find(
    (tba) => tba.account === props.account,
  );

  return _.orderBy(
    movements.value.filter((m) => {
      if (m.account !== props.account) return false;
      else if (m.status === "completed") return false;

      if (
        linkMovementDialog.value.filterAmount &&
        transactionsSumOfAccount &&
        _.round(m.amount, 2) !== _.round(transactionsSumOfAccount.total, 2)
      )
        return false;

      if (
        linkMovementDialog.value.search !== "" &&
        !searchCompare(linkMovementDialog.value.search, m.name)
      )
        return false;

      return true;
    }),
    ["date"],
    ["desc"],
  );
});

const resetLinkMovementDialog = () => {
  linkMovementDialog.value = {
    show: false,
    search: "",
    filterAmount: true,
    movement: undefined,
  };
};

const linkMovement = async (movement: Movement) => {
  const movementActivity = movementsStore.createMovementActivity(
    props.activity.id,
    movement.id,
    movement.amount,
  );

  eventsStore.sendEvent({
    name: "createMovementActivity",
    mutation: createMovementActivityMutation,
    variables: {
      id: movementActivity.id,
      movementId: movement.id,
      activityId: props.activity.id,
      amount: movement.amount,
    },
    rollbackData: undefined,
  });

  resetLinkMovementDialog();
};

const open = () => {
  linkMovementDialog.value.show = true;
};

onMounted(() => {
  if (filteredMovements.value.length === 0) {
    linkMovementDialog.value.filterAmount = false;
  }
});
</script>

<template>
  <TTooltip text="Link a movement">
    <button
      type="button"
      class="inline-flex items-center justify-center w-6 h-6 transition text-primary-100 hover:text-white bg-primary-700 hover:bg-primary-600 border rounded-md"
      @click="open"
    >
      <i class="mdi mdi-plus text-base" />
    </button>
  </TTooltip>

  <TransitionRoot appear :show="linkMovementDialog.show" as="template">
    <Dialog as="div" class="relative z-50" @close="resetLinkMovementDialog">
      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-2 text-center"
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
              class="w-full max-w-2xl transform overflow-hidden rounded-lg bg-primary-800 text-left align-middle shadow-2xl transition-all border max-h-[400px] flex flex-col"
            >
              <div class="px-4 pt-4 pb-2 border-b">
                <div class="flex mb-2">
                  <div
                    class="text-xs bg-primary-400 px-2.5 h-6 flex items-center text-white rounded font-medium"
                  >
                    #{{ activity.number }} -
                    {{ activity.name }}
                  </div>
                </div>

                <div class="flex items-center">
                  <input
                    v-model="linkMovementDialog.search"
                    placeholder="Search for a movement ..."
                    name="movement-search"
                    class="pl-1 text-left min-w-0 border-none h-10 text-lg bg-transparent flex-1 text-white"
                    autofocus
                  />

                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-6 h-6 transition hover:bg-primary-600 rounded"
                    :class="
                      linkMovementDialog.filterAmount
                        ? 'text-primary-400'
                        : 'text-primary-400'
                    "
                    @click="
                      linkMovementDialog.filterAmount =
                        !linkMovementDialog.filterAmount
                    "
                  >
                    <i class="mdi mdi-currency-eur text-base" />
                  </button>
                </div>
              </div>

              <div class="px-3 py-3 overflow-auto flex-1">
                <div
                  v-for="movement in filteredMovements"
                  :key="movement.id"
                  class="flex items-center text-sm shrink-0 h-8 rounded hover:bg-primary-600 px-2 my-1"
                  @click="linkMovement(movement)"
                >
                  <div class="hidden sm:block text-primary-100 w-20 shrink-0">
                    {{ dayjs(movement.date).format("DD/MM/YYYY") }}
                  </div>
                  <div class="sm:hidden text-primary-100 w-10 shrink-0">
                    {{ dayjs(movement.date).format("DD/MM") }}
                  </div>

                  <AccountLabel :account-id="movement.account" />
                  <div
                    class="ml-1 text-white text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    {{ movement.name }}
                  </div>
                  <div class="flex-1" />
                  <div class="w-20 whitespace-nowrap text-right text-white">
                    {{ getCurrencyFormatter().format(movement.amount) }}
                  </div>
                </div>

                <div
                  v-if="filteredMovements.length === 0"
                  class="flex items-center justify-center w-full text-primary-100 text-sm py-2"
                >
                  No movement waiting for reconciliation found.
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
