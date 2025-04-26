<script setup lang="ts">
import Color from "colorjs.io";
import type { Dayjs } from "dayjs";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import _ from "lodash";

import {
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
  useAccountsStore,
} from "@/stores/accounts";
import { usePeriodsStore } from "@/stores/periods";

import { getCurrencyFormatter } from "@/utils/currency";

import type { PeriodAccountData } from "@/types/periods";
import { AccountType } from "@maille/core/accounts";
import { useActivitiesStore } from "@/stores/activities";
import type { UUID } from "crypto";

const props = withDefaults(
  defineProps<{
    periodDate: Dayjs;
    noFilter?: boolean;
  }>(),
  { noFilter: false },
);

const periodsStore = usePeriodsStore();
const { viewFilters, periodsAccountData } = storeToRefs(periodsStore);

const accountsStore = useAccountsStore();
const { accounts } = storeToRefs(accountsStore);

const activitiesStore = useActivitiesStore();
const { showTransactions } = storeToRefs(activitiesStore);

const periodAccountData = computed<PeriodAccountData>(() => {
  return periodsAccountData.value.find(
    (p) =>
      p.month === props.periodDate.month() &&
      p.year === props.periodDate.year(),
  )!;
});

const previousPeriodAccountData = computed<PeriodAccountData | undefined>(
  () => {
    return periodsAccountData.value.find(
      (p) =>
        p.month === props.periodDate.subtract(1, "month").month() &&
        p.year === props.periodDate.subtract(1, "month").year(),
    );
  },
);

const periodAccountsGatheredData = computed(() => {
  return accounts.value.map((a) => {
    return {
      account: a,
      periodData: periodAccountData.value.accounts.find(
        (ad) => ad.account === a.id,
      ),
      previousPeriodData: previousPeriodAccountData.value?.accounts.find(
        (ad) => ad.account === a.id,
      ),
    };
  });
});

const selectAccountToFilterActivities = (account: UUID) => {
  if (props.noFilter) return;

  showTransactions.value = true;
  if (viewFilters.value.account !== account) {
    viewFilters.value.account = account;
  } else {
    viewFilters.value.account = null;
  }
};

const getProgressBarColor = (index: number, accountType: AccountType) => {
  const color = new Color(
    {
      [AccountType.BANK_ACCOUNT]: "#a5b4fc",
      [AccountType.INVESTMENT_ACCOUNT]: "#fdba74",
      [AccountType.CASH]: "#d6d3d1",
      [AccountType.LIABILITIES]: "#7dd3fc",
      [AccountType.EXPENSE]: "#fca5a5",
      [AccountType.REVENUE]: "#86efac",
    }[accountType],
  );
  color.lch.l =
    80 +
    (index / accounts.value.filter((a) => a.type === accountType).length) * -50;
  return color;
};
</script>

<template>
  <div
    v-for="accountType in [
      AccountType.BANK_ACCOUNT,
      AccountType.INVESTMENT_ACCOUNT,
      AccountType.CASH,
      AccountType.LIABILITIES,
    ]"
    :key="accountType"
    class="border-b py-3 px-3 w-full"
  >
    <div class="flex items-center px-3 h-9">
      <div
        class="h-3 w-3 rounded-xl mr-2 sm:mr-3 shrink-0"
        :class="ACCOUNT_TYPES_COLOR[accountType]"
      />
      <div class="text-white font-medium text-sm">
        {{ ACCOUNT_TYPES_NAME[accountType] }}
      </div>

      <div class="flex-1" />

      <template
        v-if="
          periodAccountsGatheredData
            .filter((pagcd) => pagcd.account.type === accountType)
            .reduce(
              (total, pagd) => total + (pagd.previousPeriodData?.balance ?? 0),
              0,
            ) !==
          periodAccountsGatheredData
            .filter((pagcd) => pagcd.account.type === accountType)
            .reduce((total, pagd) => total + (pagd.periodData?.balance ?? 0), 0)
        "
      >
        <span class="text-primary-100 text-sm font-mono">
          {{
            getCurrencyFormatter().format(
              periodAccountsGatheredData
                .filter((pagcd) => pagcd.account.type === accountType)
                .reduce(
                  (total, pagd) =>
                    total + (pagd.previousPeriodData?.balance ?? 0),
                  0,
                ),
            )
          }}
        </span>
        <i class="mdi mdi-arrow-right mx-2 text-primary-200 text-sm" />
      </template>
      <span class="font-medium text-primary-100 text-sm font-mono">
        {{
          getCurrencyFormatter().format(
            periodAccountsGatheredData
              .filter((pagcd) => pagcd.account.type === accountType)
              .reduce(
                (total, pagd) => total + (pagd.periodData?.balance ?? 0),
                0,
              ),
          )
        }}
      </span>
    </div>

    <div class="px-2 my-1">
      <div
        v-if="
          periodAccountsGatheredData
            .filter((pagcd) => pagcd.account.type === accountType)
            .reduce(
              (total, pagd) => total + (pagd.periodData?.balance ?? 0),
              0,
            ) !== 0
        "
        class="w-full h-2 hover:h-4 transition-all rounded-md flex items-center overflow-hidden bg-primary-900"
      >
        <TTooltip
          v-for="(accountData, index) in periodAccountsGatheredData.filter(
            (ad) => ad.account.type === accountType,
          )"
          :key="accountData.account.id"
          :text="`${accountData.account.name} (${_.round(
            ((accountData.periodData?.balance ?? 0) /
              periodAccountsGatheredData
                .filter((pagcd) => pagcd.account.type === accountType)
                .reduce(
                  (total, pagd) =>
                    total + Math.abs(pagd.periodData?.balance ?? 0),
                  0,
                )) *
              100,
            2,
          )}%)`"
          placement="bottom"
          class="h-full transition-all hover:opacity-50"
          :style="`background-color: ${getProgressBarColor(
            index,
            accountType,
          )}; width: ${
            (100 /
              periodAccountsGatheredData
                .filter((pagcd) => pagcd.account.type === accountType)
                .reduce(
                  (total, pagd) =>
                    total + Math.abs(pagd.periodData?.balance ?? 0),
                  0,
                )) *
            Math.abs(accountData.periodData?.balance ?? 0)
          }%;`"
        />
      </div>
    </div>

    <div
      v-for="accountData in periodAccountsGatheredData.filter(
        (ad) => ad.account.type === accountType,
      )"
      :key="accountData.account.id"
      class="rounded flex flex-col justify-center group pl-6"
      :class="[
        accountType === AccountType.BANK_ACCOUNT &&
        accountData.account.startingCashBalance !== null
          ? 'h-16'
          : 'h-9',
        viewFilters.account === accountData.account.id
          ? 'bg-primary-900'
          : 'hover:bg-primary-900',
      ]"
      @click="selectAccountToFilterActivities(accountData.account.id)"
    >
      <div class="flex items-center rounded px-3">
        <div class="font-medium text-primary-100 text-xs">
          {{ accountData.account.name }}
        </div>

        <div class="flex-1" />

        <div
          v-if="!noFilter"
          class="mr-4 text-primary-300 text-sm"
          :class="
            viewFilters.account === accountData.account.id
              ? ''
              : 'hidden group-hover:block'
          "
        >
          <template v-if="viewFilters.account === accountData.account.id">
            Clear filter
          </template>
          <template v-else> Filter </template>
        </div>

        <template
          v-if="
            accountData.previousPeriodData?.balance !==
            accountData.periodData?.balance
          "
        >
          <span class="text-primary-200 text-sm font-mono">
            {{
              getCurrencyFormatter().format(
                accountData.previousPeriodData?.balance ?? 0,
              )
            }}
          </span>
          <i class="mdi mdi-arrow-right mx-2 text-primary-200 text-sm" />
        </template>
        <div
          class="whitespace-nowrap text-primary-100 text-sm font-medium font-mono"
        >
          {{
            getCurrencyFormatter().format(accountData.periodData?.balance ?? 0)
          }}
        </div>
      </div>

      <div
        v-if="
          accountType === AccountType.BANK_ACCOUNT &&
          accountData.account.startingCashBalance !== null
        "
      >
        <div class="flex items-center px-3 mt-2">
          <div class="text-primary-100 text-xs ml-3">Cash balance</div>

          <div class="flex-1" />

          <div
            class="whitespace-nowrap text-primary-100 text-sm font-medium font-mono"
          >
            {{
              getCurrencyFormatter().format(
                accountData.periodData?.cash.balance ?? 0,
              )
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
