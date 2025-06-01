<script setup lang="ts">
import dayjs from "dayjs";
import { computed, ref } from "vue";
import type { UUID } from "crypto";

import { useMovementsStore } from "@/stores/movements";

import LinkMovementButton from "@/containers/movements/LinkMovementButton.vue";

import AccountLabel from "@/components/AccountLabel.vue";
import TAmountInput from "@/components/designSystem/TAmountInput.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import {
  getActivityMovementsReconciliated,
  getActivityMovementsReconciliatedByAccount,
} from "@maille/core/activities";
import type { MovementWithLink } from "@maille/core/movements";
import type { Activity } from "@maille/core/activities";
import { useAccountsStore } from "@/stores/accounts";
import { storeToRefs } from "pinia";
import { useEventsStore } from "@/stores/events";
import {
  deleteMovementActivityMutation,
  updateMovementActivityMutation,
} from "@/mutations/movements";

const movementsStore = useMovementsStore();
const eventsStore = useEventsStore();

const accountsStore = useAccountsStore();
const { accounts } = storeToRefs(accountsStore);

const props = defineProps<{ activity: Activity }>();

const showMovements = ref(true);
const movementsAmountInputs = ref<
  Record<UUID, InstanceType<typeof TAmountInput> | null>
>({});

const movementsReconciliatedByAccount = computed(() => {
  return getActivityMovementsReconciliatedByAccount(
    props.activity.transactions,
    props.activity.movements,
    accounts.value,
    movementsStore.getMovementById,
  );
});

const handleMovementMenuClick = (
  movementWithLink: MovementWithLink,
  event: string,
) => {
  if (event === "unlink") {
    movementsStore.deleteMovementActivity(
      movementWithLink.id,
      movementWithLink.movementActivityId,
    );

    eventsStore.sendEvent({
      name: "deleteMovementActivity",
      mutation: deleteMovementActivityMutation,
      variables: {
        id: movementWithLink.movementActivityId,
      },
      rollbackData: {
        id: movementWithLink.movementActivityId,
        movement: movementWithLink.id,
        activity: props.activity.id,
        amount: movementWithLink.amountLinked,
      },
    });
  } else if (event === "resetAmount") {
    movementsStore.updateMovementActivity(
      movementWithLink.id,
      movementWithLink.movementActivityId,
      movementWithLink.amount,
    );

    eventsStore.sendEvent({
      name: "updateMovementActivity",
      mutation: updateMovementActivityMutation,
      variables: {
        id: movementWithLink.movementActivityId,
        amount: movementWithLink.amount,
      },
      rollbackData: {
        id: movementWithLink.movementActivityId,
        movement: movementWithLink.id,
        amount: movementWithLink.amountLinked,
      },
    });
  } else if (event === "editAmount") {
    movementsAmountInputs.value[movementWithLink.movementActivityId]?.click();
  }
};

const updateAmountLinked = (
  movementWithLink: MovementWithLink,
  newAmount: number,
) => {
  movementsStore.updateMovementActivity(
    movementWithLink.id,
    movementWithLink.movementActivityId,
    newAmount,
  );

  eventsStore.sendEvent({
    name: "updateMovementActivity",
    mutation: updateMovementActivityMutation,
    variables: {
      id: movementWithLink.movementActivityId,
      amount: newAmount,
    },
    rollbackData: {
      id: movementWithLink.movementActivityId,
      movement: movementWithLink.id,
      amount: movementWithLink.amountLinked,
    },
  });
};
</script>
<template>
  <div class="border-b py-6 px-4 sm:px-8">
    <div class="flex items-center">
      <div
        class="text-sm font-medium text-primary-100 rounded h-7 hover:text-white flex items-center w-full"
        @click="showMovements = !showMovements"
      >
        Movements
        <i
          class="mdi ml-2"
          :class="showMovements ? 'mdi-menu-down' : 'mdi-menu-up'"
        />

        <div class="flex-1" />
        <i
          v-if="
            !getActivityMovementsReconciliated(
              activity.transactions,
              activity.movements,
              accounts,
              movementsStore.getMovementById,
            )
          "
          class="mdi mdi-progress-helper text-xl text-orange-300 px-1"
        />
        <i v-else class="mdi mdi-check-circle text-xl text-emerald-400 px-1" />
      </div>
    </div>

    <div v-show="showMovements">
      <div
        v-for="movementsReconciliatedOfAccount in movementsReconciliatedByAccount"
        :key="movementsReconciliatedOfAccount.account"
        class="mt-4 mb-2 border bg-primary-800 rounded py-4 -mx-3 sm:-mx-4"
      >
        <div class="flex items-center px-4">
          <AccountLabel
            :account-id="movementsReconciliatedOfAccount.account"
            class="text-sm ml-0.5"
          />

          <div class="flex-1" />

          <div
            class="whitespace-nowrap ml-3 font-medium text-sm mr-4 font-mono"
            :class="
              !movementsReconciliatedOfAccount.reconcilied
                ? 'text-red-400'
                : 'text-primary-200'
            "
          >
            {{
              getCurrencyFormatter().format(
                movementsReconciliatedOfAccount.movementTotal,
              )
            }}
            /
            {{
              getCurrencyFormatter().format(
                movementsReconciliatedOfAccount.transactionTotal,
              )
            }}
          </div>

          <LinkMovementButton
            :activity="activity"
            :account="movementsReconciliatedOfAccount.account"
          />
        </div>

        <div class="mt-4 mb-2">
          <template
            v-for="movement in movementsReconciliatedOfAccount.movements"
            :key="movement.id"
          >
            <hr class="border-t" />

            <div
              class="h-10 flex items-center justify-center text-sm hover:bg-primary-700 px-4"
            >
              <div class="hidden sm:block text-primary-100 w-16 mr-4 shrink-0">
                {{ dayjs(movement.date).format("DD/MM/YYYY") }}
              </div>
              <div
                class="ml-1 text-white text-ellipsis overflow-hidden whitespace-nowrap"
              >
                {{ movement.name }}
                <span
                  v-if="movement.amountLinked !== movement.amount"
                  class="text-sm text-primary-100 ml-2 whitespace-nowrap font-mono"
                >
                  ({{ getCurrencyFormatter().format(movement.amount) }})
                </span>
              </div>

              <div class="flex-1" />

              <TAmountInput
                :ref="
                  (el) =>
                    (movementsAmountInputs[movement.movementActivityId] =
                      el as InstanceType<typeof TAmountInput>)
                "
                :model-value="movement.amountLinked"
                borderless
                class="mr-4"
                @update:model-value="updateAmountLinked(movement, $event)"
              />

              <TMenu
                :items="[
                  {
                    value: 'editAmount',
                    text: 'Modify amount linked',
                    icon: 'book-edit',
                  },
                  {
                    value: 'resetAmount',
                    text: 'Reset amount linked',
                    icon: 'book-refresh',
                  },
                  {
                    value: 'unlink',
                    text: 'Unlink',
                    icon: 'link-variant-off',
                  },
                ]"
                @click:item="handleMovementMenuClick(movement, $event)"
              />
            </div>
          </template>
          <div
            v-if="movementsReconciliatedOfAccount.movements.length === 0"
            class="mt-4 text-sm text-primary-600 px-4"
          >
            No movement added for this account.
          </div>
          <hr v-else class="border-t" />
        </div>
      </div>

      <div
        v-if="movementsReconciliatedByAccount!.length === 0"
        class="mt-4 text-sm text-primary-300 rounded border bg-primary-800 p-4 -mx-4"
      >
        No movement needed for this activity.
      </div>
    </div>
  </div>
</template>
