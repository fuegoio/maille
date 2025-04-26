<script setup lang="ts">
import dayjs from "dayjs";
import _ from "lodash";
import { storeToRefs } from "pinia";
import { computed } from "vue";

import { usePeriodsStore } from "@/stores/periods";

import PeriodLabel from "@/components/periods/PeriodLabel.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import type { Period, PeriodActivityData } from "@/types/periods";
import { useHeadStore } from "@/stores/head";

const periodsStore = usePeriodsStore();
const {
  periodsAvailable,
  periodsActivityData,
  periodsForecastData,
} = storeToRefs(periodsStore);

const headStore = useHeadStore();
headStore.updateTitle("Periods");

const now = dayjs();

const periodsAvailableSorted = computed(() => {
  return _.orderBy(
    periodsAvailable.value,
    ["year", "month"],
    ["desc", "desc"],
  ).filter((p, i, arr) => {
    if (
      periodsStore.getPeriodLabel(p) === "Current" ||
      periodsStore.getPeriodLabel(p) === "Completed"
    )
      return true;

    if (arr[i + 1]) {
      return periodsStore.getPeriodLabel(arr[i + 1]) === "Current";
    } else {
      return true;
    }
  });
});

const periodsActivityDataSorted = computed<
  (PeriodActivityData & {
    label: string;
    forecast: PeriodActivityData | undefined;
  })[]
>(() => {
  return periodsAvailableSorted.value.map((p) => {
    return {
      ...periodsActivityData.value.find(
        (pad) => pad.month === p.month && pad.year === p.year,
      )!,
      label: periodsStore.getPeriodLabel(p),
      forecast: periodsForecastData.value.find(
        (pfd) => pfd.month === p.month && pfd.year === p.year,
      ),
    };
  });
});

const periodFormatter = (month: number, year: number): string => {
  return dayjs().month(month).year(year).format("MMMM YYYY");
};

const getPeriodRouteParam = (period: Period) => {
  if (period.month === now.month() && period.year === now.year()) {
    return "current";
  }

  const pastPeriod = now.subtract(1, "month");
  if (
    period.month === pastPeriod.month() &&
    period.year === pastPeriod.year()
  ) {
    return "past";
  }

  return dayjs().month(period.month).year(period.year).format("YYYY-MM");
};
</script>

<template>
  <div
    class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900 overflow-hidden"
  >
    <header class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center mb-1">
      <div class="text-sm font-semibold text-white truncate">All periods</div>
    </header>

    <div class="flex flex-col flex-1 w-full overflow-x-hidden pb-10">
      <div
        class="w-20 border-r h-10 min-w-0 shrink-0 relative hidden sm:block"
      />

      <RouterLink
        v-for="(period, index) in periodsActivityDataSorted"
        :key="`${period.month}-${period.year}`"
        class="flex items-center hover:bg-primary-800/20 transition-colors"
        :to="{
          name: 'period',
          params: {
            period: getPeriodRouteParam(period),
          },
        }"
      >
        <div
          class="w-20 border-r h-full min-w-0 shrink-0 relative hidden sm:block"
          :class="[period.label === 'Current' ? 'border-r-primary-300' : '']"
        >
          <div
            class="h-4 w-4 rounded-xl bg-primary-700 border-2 absolute -top-2 -right-2 z-10"
            :class="[period.label === 'Current' ? 'border-primary-300' : '']"
          />

          <div
            v-if="index === 0 || period.month === 0"
            class="text-right text-sm text-white absolute -top-2 right-6 z-10 font-semibold"
          >
            {{ period.year }}
          </div>
        </div>

        <div
          class="ml-2 sm:ml-10 mr-2 py-6 px-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between w-full"
          :class="[
            period.label === 'Current'
              ? 'sm:pb-20 sm:border-t-primary-300'
              : '',
          ]"
        >
          <div class="flex items-center sm:block sm:w-2/12">
            <div
              class="font-semibold sm:mb-2"
              :class="
                period.label === 'Current' ? 'text-white' : 'text-primary-200'
              "
            >
              {{ periodFormatter(period.month, period.year) }}
            </div>
            <PeriodLabel :period="period" class="ml-2 sm:ml-0" />
            <div class="flex-1 sm:hidden" />
            <div
              class="h-2 w-2 rounded-xl shrink-0 mr-2 bg-primary-300 sm:hidden"
            />
            <div
              class="text-white text-right text-sm font-medium sm:hidden font-mono"
            >
              {{ getCurrencyFormatter().format(period.balance) }}
            </div>
          </div>

          <div
            v-for="activityType in [
              {
                name: 'Revenue',
                color: 'bg-green-300',
                value: period.revenue,
                forecast: period.forecast?.revenue,
                isOverflowPositive: true,
              },
              {
                name: 'Expense',
                color: 'bg-red-300',
                value: period.expense,
                forecast: period.forecast?.expense,
                isOverflowPositive: false,
              },
              {
                name: 'Investment',
                color: 'bg-orange-300',
                value: period.investment,
                forecast: period.forecast?.investment,
                isOverflowPositive: true,
              },
              {
                name: 'Balance',
                color: 'bg-indigo-300',
                value: period.balance,
                forecast: period.forecast?.balance,
                isOverflowPositive: true,
              },
            ]"
            :key="activityType.name"
            class="mt-2 py-1 w-1/5 hidden sm:block"
          >
            <div class="flex items-center">
              <div
                class="h-2 w-2 rounded-xl shrink-0 mr-2"
                :class="activityType.color"
              />
              <span class="text-sm text-white">
                {{ activityType.name }}
              </span>
            </div>

            <div class="text-sm ml-4 sm:mt-2 flex items-center">
              <template v-if="period.label !== 'Future'">
                <div class="whitespace-nowrap text-white font-medium font-mono">
                  {{ getCurrencyFormatter().format(activityType.value) }}
                </div>
              </template>
              <div v-else class="text-primary-100 text-right font-mono">
                {{
                  getCurrencyFormatter().format(
                    activityType.forecast !== undefined
                      ? activityType.forecast
                      : activityType.value,
                  )
                }}
              </div>
            </div>
          </div>
        </div>
      </RouterLink>

      <div class="flex-1 border-r w-20 hidden sm:block" />
    </div>
  </div>
</template>
