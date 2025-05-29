<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";

import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
} from "@headlessui/vue";

import AccountLabel from "@/components/AccountLabel.vue";
import AccountSelect from "@/components/accounts/AccountSelect.vue";
import ProjectSelect from "@/components/projects/ProjectSelect.vue";
import ActivityNameInput from "@/components/activities/ActivityNameInput.vue";

import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivitiesStore,
} from "@/stores/activities";
import { useAccountsStore } from "@/stores/accounts";

import { getCurrencyFormatter } from "@/utils/currency";

import { ActivityType } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";
import { AccountType } from "@maille/core/accounts";
import type { UUID } from "crypto";
import { createActivityMutation } from "@/mutations/activities";
import { useEventsStore } from "@/stores/events";
import { toast } from "vue-sonner";

const activitiesStore = useActivitiesStore();
const { categories, subcategories } = storeToRefs(activitiesStore);

const accountsStore = useAccountsStore();

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    movement?: Movement;
    movements?: Movement[];
    amount?: number;
    name?: string;
    date?: dayjs.Dayjs;
    type?: ActivityType;
  }>(),
  {
    movement: undefined,
    movements: undefined,
    name: undefined,
    date: undefined,
    amount: undefined,
    type: undefined,
  },
);
const emit = defineEmits(["update:modelValue"]);

const nameInput = ref<HTMLInputElement | null>(null);

const addNewActivityDialog = ref({
  show: false,
  name: undefined as string | undefined,
  description: undefined as string | undefined,
  date: undefined as dayjs.Dayjs | undefined,
  type: undefined as ActivityType | undefined,
  category: null as UUID | null,
  subcategory: null as UUID | null,
  project: null as UUID | null,
  transactions: [] as {
    fromAccount: UUID | undefined;
    toAccount: UUID | undefined;
    amount: number;
  }[],
  movement: undefined as Movement | undefined,
});

const resetAddNewActivityDialog = () => {
  addNewActivityDialog.value.show = false;

  setTimeout(() => {
    if (addNewActivityDialog.value.show) return;
    addNewActivityDialog.value = {
      show: false,
      name: undefined,
      description: undefined,
      date: undefined,
      type: undefined,
      category: null,
      subcategory: null,
      project: null,
      transactions: [],
      movement: undefined,
    };
    emit("update:modelValue", false);
  }, 200);
};

const validForm = computed(() => {
  if (
    addNewActivityDialog.value.name === undefined ||
    addNewActivityDialog.value.name === ""
  )
    return false;
  if (addNewActivityDialog.value.date === undefined) return false;
  if (addNewActivityDialog.value.type === undefined) return false;
  return true;
});

watch(validForm, () => {
  if (validForm.value) {
    if (addNewActivityDialog.value.transactions.length === 0) {
      addTransaction();
    }
  }
});

const eventsStore = useEventsStore();

const addNewActivity = async () => {
  await createActivity();
  resetAddNewActivityDialog();
};

const createActivity = async () => {
  if (!addNewActivityDialog.value.name) {
    toast.error("A name is required for your activity.");
    return;
  } else if (!addNewActivityDialog.value.date) {
    toast.error("A date is required for your activity.");
    return;
  } else if (!addNewActivityDialog.value.type) {
    toast.error("A type is required for your activity.");
    return;
  }

  const activity = activitiesStore.createActivity({
    name: addNewActivityDialog.value.name,
    description: addNewActivityDialog.value.description ?? null,
    date: addNewActivityDialog.value.date,
    type: addNewActivityDialog.value.type,
    category: addNewActivityDialog.value.category,
    subcategory: addNewActivityDialog.value.subcategory,
    project: addNewActivityDialog.value.project,
    transactions: addNewActivityDialog.value.transactions.map((t) => ({
      fromAccount: t.fromAccount!,
      toAccount: t.toAccount!,
      amount: t.amount,
    })),
    movement: addNewActivityDialog.value.movement,
  });

  eventsStore.sendEvent({
    name: "createActivity",
    mutation: createActivityMutation,
    variables: {
      id: activity.id,
      name: activity.name,
      description: activity.description,
      date: activity.date.format("YYYY-MM-DD"),
      type: activity.type,
      category: activity.category,
      subcategory: activity.subcategory,
      project: activity.project,
      transactions: activity.transactions.map((t) => {
        return {
          id: t.id,
          fromAccount: t.fromAccount,
          toAccount: t.toAccount,
          amount: t.amount,
        };
      }),
      movement: activity.movements[0],
    },
    rollbackData: undefined,
  });
};

const openDialog = () => {
  addNewActivityDialog.value.show = true;
  addNewActivityDialog.value.date = dayjs();

  if (props.movement) {
    addNewActivityDialog.value.name = props.movement.name;
    addNewActivityDialog.value.date = props.movement.date;
    addNewActivityDialog.value.type =
      props.movement.amount < 0 ? ActivityType.EXPENSE : ActivityType.REVENUE;

    addNewActivityDialog.value.transactions = [];
    addNewActivityDialog.value.movement = props.movement;
  } else if (props.movements) {
    const firstMovement = props.movements[0];
    addNewActivityDialog.value.name = firstMovement.name;

    if (props.movements.every((m) => m.amount < 0)) {
      addNewActivityDialog.value.type = ActivityType.EXPENSE;
    } else if (props.movements.every((m) => m.amount > 0)) {
      addNewActivityDialog.value.type = ActivityType.REVENUE;
    }

    addNewActivityDialog.value.transactions = [];
  } else {
    addNewActivityDialog.value.name = props.name;
    addNewActivityDialog.value.type = props.type;

    if (props.date) {
      addNewActivityDialog.value.date = props.date;
    }
  }

  nextTick(() => {
    if (nameInput.value) nameInput.value.focus();
  });
};

const guessBestTransaction = () => {
  let fromAccount;
  let toAccount;

  if (addNewActivityDialog.value.type === ActivityType.EXPENSE) {
    fromAccount = accountsStore.accounts.find(
      (a) => a.type === AccountType.BANK_ACCOUNT,
    )?.id;

    // If there is one or more movements, we can guess the account
    if (props.movement) {
      fromAccount = props.movement.account;
    } else if (props.movements) {
      const firstMovement = props.movements[0];
      if (props.movements.every((m) => m.account === firstMovement.account)) {
        fromAccount = firstMovement.account;
      } else {
        fromAccount = undefined;
      }
    }

    toAccount = accountsStore.accounts.find(
      (a) => a.type === AccountType.EXPENSE,
    )?.id;
  } else if (addNewActivityDialog.value.type === ActivityType.REVENUE) {
    fromAccount = accountsStore.accounts.find(
      (a) => a.type === AccountType.REVENUE,
    )?.id;

    toAccount = accountsStore.accounts.find(
      (a) => a.type === AccountType.BANK_ACCOUNT,
    )?.id;

    // If there is one or more movements, we can guess the account
    if (props.movement) {
      toAccount = props.movement.account;
    } else if (props.movements) {
      const firstMovement = props.movements[0];
      if (props.movements.every((m) => m.account === firstMovement.account)) {
        toAccount = firstMovement.account;
      } else {
        toAccount = undefined;
      }
    }
  } else if (addNewActivityDialog.value.type === ActivityType.INVESTMENT) {
    fromAccount = accountsStore.accounts.find(
      (a) => a.type === AccountType.BANK_ACCOUNT,
    )?.id;
    toAccount = accountsStore.accounts.find(
      (a) => a.type === AccountType.INVESTMENT_ACCOUNT,
    )?.id;
  }

  return { fromAccount, toAccount };
};

const addTransaction = () => {
  const { fromAccount, toAccount } = guessBestTransaction();

  let amount = 0;
  if (props.movement) {
    amount = Math.abs(props.movement.amount);
  } else if (props.movements) {
    const firstMovement = props.movements[0];
    amount = Math.abs(firstMovement.amount);
  }

  addNewActivityDialog.value.transactions.push({
    fromAccount,
    toAccount,
    amount,
  });
};

const transactionsSum = computed(() => {
  return addNewActivityDialog.value.transactions.reduce(
    (s, t) => s + t.amount,
    0,
  );
});

const addNewActivities = async () => {
  if (!props.movements) return;

  for (const movement of props.movements) {
    const { fromAccount, toAccount } = guessBestTransaction();

    addNewActivityDialog.value.date = movement.date;
    addNewActivityDialog.value.movement = movement;
    addNewActivityDialog.value.transactions = [
      {
        fromAccount,
        toAccount,
        amount: Math.abs(movement.amount),
      },
    ];
    await createActivity();
  }

  resetAddNewActivityDialog();
};

watch(
  () => props.modelValue,
  (show: boolean) => {
    if (show) {
      openDialog();
    } else {
      resetAddNewActivityDialog();
    }
  },
  { immediate: true },
);
</script>

<template>
  <TransitionRoot appear :show="addNewActivityDialog.show" as="template">
    <Dialog as="div" class="relative z-50" @close="resetAddNewActivityDialog">
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
                    class="-mx-2 text-xs bg-primary-400 px-2.5 h-6 flex items-center text-white rounded min-w-0 font-medium"
                  >
                    <template v-if="movement">
                      <AccountLabel :account-id="movement.account" />
                      <span class="px-2">-</span>
                      <span class="truncate min-w-0">
                        {{ movement.name }}
                      </span>
                    </template>
                    <template v-else-if="movements">
                      <span class="truncate min-w-0">
                        {{ movements.length }} movements
                      </span>
                    </template>
                    <template v-else> New activity </template>
                  </div>
                </div>

                <div class="flex-1" />
                <button
                  class="inline-flex items-center justify-center w-6 h-6 transition text-primary-500 hover:text-primary-100 min-w-6 shrink-0"
                  @click="resetAddNewActivityDialog"
                >
                  <i class="mdi mdi-close text-lg" />
                </button>
              </div>

              <div class="px-4 sm:px-8 pt-3 pb-3">
                <TDatePicker
                  v-if="!movements"
                  v-model="addNewActivityDialog.date"
                  borderless
                  class="font-semibold text-primary-100 text-sm"
                />
                <div
                  v-else
                  class="text-sm rounded text-primary-500 font-medium h-8 flex items-center"
                >
                  Date of the movement
                </div>

                <div class="flex items-center">
                  <ActivityNameInput
                    v-model="addNewActivityDialog.name"
                    autofocus
                  />
                </div>
                <textarea
                  v-model="addNewActivityDialog.description"
                  name="activity-description"
                  class="mt-3 text-sm border-none w-full text-primary-100 break-words resize-none bg-transparent placeholder:text-primary-600"
                  placeholder="Description (optional)"
                />
              </div>

              <div class="px-4 sm:px-8 pb-4 flex items-center gap-2 flex-wrap">
                <TSelect
                  v-model="addNewActivityDialog.type"
                  :items="[
                    { id: ActivityType.REVENUE, name: 'Revenue' },
                    { id: ActivityType.EXPENSE, name: 'Expense' },
                    { id: ActivityType.INVESTMENT, name: 'Investment' },
                    { id: ActivityType.NEUTRAL, name: 'Neutral' },
                  ]"
                  item-value="id"
                  item-text="name"
                  placeholder="Activity type"
                  class="h-8"
                  @update:model-value="addNewActivityDialog!.category = null"
                >
                  <template #selected="{ item }">
                    <div class="flex items-center">
                      <div
                        class="size-3 rounded shrink-0 mr-3"
                        :class="`bg-${ACTIVITY_TYPES_COLOR[item.id as ActivityType]}-300`"
                      />
                      <span class="text-sm text-white">
                        {{ ACTIVITY_TYPES_NAME[item.id as ActivityType] }}
                      </span>
                    </div>
                  </template>

                  <template #item="{ item, selected }">
                    <div class="flex items-center">
                      <div
                        class="size-3 rounded shrink-0 mr-3"
                        :class="`bg-${ACTIVITY_TYPES_COLOR[item.id as ActivityType]}-300`"
                      />
                      <span class="text-sm text-primary-100 mb-[1px]">
                        {{ ACTIVITY_TYPES_NAME[item.id as ActivityType] }}
                      </span>
                    </div>
                  </template>
                </TSelect>

                <TSelect
                  v-model="addNewActivityDialog.category"
                  :disabled="addNewActivityDialog.type === undefined"
                  :items="
                    categories.filter(
                      (c) => c.type === addNewActivityDialog.type,
                    )
                  "
                  item-value="id"
                  item-text="name"
                  placeholder="Category"
                  class="h-8"
                />

                <TSelect
                  v-model="addNewActivityDialog.subcategory"
                  :disabled="addNewActivityDialog.category === null"
                  :items="
                    subcategories.filter(
                      (sc) => sc.category === addNewActivityDialog.category,
                    )
                  "
                  item-value="id"
                  item-text="name"
                  placeholder="Subcategory"
                  class="h-8"
                />

                <ProjectSelect
                  v-model="addNewActivityDialog.project"
                  class="h-8"
                />
              </div>

              <div
                class="px-4 sm:px-6 py-2 overflow-auto flex-1 bg-primary-700 border-t pb-8"
              >
                <div
                  class="text-sm font-medium text-white px-2 py-2 border-b border-primary-600 flex items-center"
                >
                  Transactions

                  <div class="flex-1" />

                  <div
                    v-if="addNewActivityDialog.transactions.length > 0"
                    class="flex items-center justify-end text-sm text-primary-100 font-mono mr-0.5"
                  >
                    {{ getCurrencyFormatter().format(transactionsSum) }}
                  </div>
                  <button
                    v-if="!movements"
                    class="w-7 h-7 hover:bg-primary-500 flex items-center justify-center rounded ml-2"
                    @click="addTransaction"
                  >
                    <i class="mdi mdi-plus" />
                  </button>
                </div>

                <div
                  v-for="(
                    transaction, index
                  ) in addNewActivityDialog.transactions"
                  :key="index"
                  class="w-full flex items-center text-sm shrink-0 h-10 rounded pr-2.5 border-b"
                >
                  <AccountSelect v-model="transaction.fromAccount" borderless />
                  <div class="mx-2 text-center text-primary-100">to</div>
                  <AccountSelect v-model="transaction.toAccount" borderless />

                  <div class="flex-1" />

                  <TAmountInput v-model="transaction.amount" borderless />
                  <button
                    v-if="!movements"
                    class="ml-3 w-6 h-6 hover:bg-primary-500 flex items-center justify-center rounded text-primary-300 hover:text-white"
                    @click="addNewActivityDialog.transactions.splice(index, 1)"
                  >
                    <i class="mdi mdi-delete" />
                  </button>
                </div>
              </div>

              <div class="border-t px-4 sm:px-8 py-4 flex justify-between">
                <TBtn outlined class="mr-3" @click="resetAddNewActivityDialog">
                  Cancel
                </TBtn>
                <TBtn v-if="!movements" @click="addNewActivity">
                  Create activity
                </TBtn>
                <TBtn v-else @click="addNewActivities">
                  Create activities
                </TBtn>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
