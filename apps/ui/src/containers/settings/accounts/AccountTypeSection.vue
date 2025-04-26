<script setup lang="ts">
import dayjs from "dayjs";
import _ from "lodash";
import { storeToRefs } from "pinia";
import type { UUID } from "crypto";
import { computed, ref } from "vue";

import {
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
  useAccountsStore,
} from "@/stores/accounts";

import { AccountType } from "@maille/core/accounts";
import { useSettingsStore } from "@/stores/settings";
import { useActivitiesStore } from "@/stores/activities";

const accountsStore = useAccountsStore();
const { accounts } = storeToRefs(accountsStore);

const activitiesStore = useActivitiesStore();
const { activities } = storeToRefs(activitiesStore);

const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);

const startingPeriodFormatted = dayjs(settings.value.startingPeriod).format(
  "MMMM YYYY",
);

const props = defineProps<{ accountType: AccountType }>();

const expanded = ref<number | null>(null);
const newAccount = ref({
  show: false,
  name: undefined as string | undefined,
});

const toggleExpand = (accountId: number) => {
  if (expanded.value === accountId) {
    expanded.value = null;
  } else {
    expanded.value = accountId;
  }
};

const sortedAccounts = computed(() => {
  return _.orderBy(
    accounts.value.filter((a) => a.type === props.accountType),
    ["default"],
    ["desc"],
  );
});

const cancelNewAccount = () => {
  newAccount.value.show = false;
  newAccount.value.name = undefined;
};

const addNewAccount = async () => {
  if (!newAccount.value.name) return;

  await accountsStore.addAccount(
    newAccount.value.name,
    props.accountType,
    true,
  );
  cancelNewAccount();
};

const updateAccount = async (accountId: UUID) => {
  await accountsStore.updateAccount(accountId);
};

const getTransactionsLinkedToAccount = (accountId: UUID) => {
  return activities.value
    .flatMap((a) => a.transactions)
    .filter((t) => t.fromAccount === accountId || t.toAccount === accountId)
    .length;
};

const deleteAccount = async (accountId: UUID) => {
  if (getTransactionsLinkedToAccount(accountId) > 0) return;

  await accountsStore.deleteAccount(accountId);
};
</script>

<template>
  <div class="pb-10">
    <div class="flex items-center mb-2 px-2">
      <div
        class="h-3 w-3 rounded-xl mr-2 sm:mr-3 shrink-0"
        :class="ACCOUNT_TYPES_COLOR[accountType]"
      />
      <div class="text-sm font-medium text-primary-400">
        {{ ACCOUNT_TYPES_NAME[accountType] }}
      </div>

      <div class="flex-1" />
      <button
        type="button"
        class="rounded hover:bg-primary-600 h-8 w-8 flex items-center justify-center group"
        @click="newAccount.show = true"
      >
        <i
          class="mdi mdi-plus text-primary-500 group-hover:text-primary-300 text-sm"
        />
      </button>
    </div>

    <div
      v-if="newAccount.show"
      class="w-full bg-primary-900 my-2 px-4 rounded h-12 flex items-center border"
    >
      <TTextField
        v-model="newAccount.name"
        placeholder="Name"
        autofocus
        dense
      />

      <div class="flex-1" />
      <TBtn outlined class="mr-2" @click="cancelNewAccount"> Cancel </TBtn>
      <TBtn @click="addNewAccount">Save</TBtn>
    </div>

    <div
      v-for="account in sortedAccounts"
      :key="account.id"
      class="w-full border my-2 px-4 rounded group"
    >
      <div class="h-10 flex items-center w-full">
        <div class="text-sm font-medium text-primary-200">
          {{ account.name }}
        </div>
        <div class="text-sm text-primary-600 ml-1">
          ·
          {{ getTransactionsLinkedToAccount(account.id) }}
          transactions
        </div>

        <div class="flex-1" />

        <div v-if="account.default" class="text-sm text-primary-600 mx-1">
          Default
        </div>
        <TDeleteConfirmation
          v-else
          :description="
            getTransactionsLinkedToAccount(account.id) > 0
              ? 'First delete all the transactions associated with this account.'
              : 'Are you sure you want to delete this account?'
          "
          :disabled="getTransactionsLinkedToAccount(account.id) > 0"
          @confirm="deleteAccount(account.id)"
        >
          <template #default="{ open }">
            <i
              class="mdi mdi-delete text-primary-700 hover:text-primary-300 text-sm mx-1 hidden group-hover:block"
              @click="open"
            />
          </template>
        </TDeleteConfirmation>

        <i
          v-if="
            ![AccountType.EXPENSE, AccountType.REVENUE].includes(account.type)
          "
          class="mdi text-primary-500 hover:text-primary-300 text-sm ml-2"
          :class="
            expanded === account.id ? 'mdi-chevron-up' : 'mdi-chevron-down'
          "
          @click="toggleExpand(account.id)"
        />
      </div>

      <div v-if="expanded === account.id" class="border-t py-4">
        <div class="flex flex-col sm:flex-row sm:items-center text-sm">
          <div class="text-sm text-primary-500">
            Starting balance (in {{ startingPeriodFormatted }})
          </div>
          <div class="flex-1" />
          <TAmountInput
            v-model="account.startingBalance"
            class="w-full sm:w-56 mt-2 sm:mt-0"
            @update:model-value="updateAccount(account.id)"
          />
        </div>

        <div
          v-if="accountType === AccountType.BANK_ACCOUNT"
          class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
        >
          <div class="text-sm text-primary-500">
            Starting cash balance (in {{ startingPeriodFormatted }})
          </div>
          <div class="flex-1" />
          <TAmountInput
            v-model="account.startingCashBalance"
            class="w-full sm:w-56 mt-2 sm:mt-0"
            placeholder=""
            clearable
            @update:model-value="updateAccount(account.id)"
          />
        </div>

        <div
          class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm h-10"
        >
          <div class="text-sm text-primary-500">Movements enabled</div>
          <div class="flex-1" />
          <input
            v-model="account.movements"
            name="check-movements"
            type="checkbox"
            class="h-4 w-4 rounded text-primary-600 focus:outline-none mt-2 sm:mt-0"
            @change="updateAccount(account.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
