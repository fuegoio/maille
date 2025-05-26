<script setup lang="ts">
import dayjs from "dayjs";
import _ from "lodash";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useRouter } from "vue-router";

import { usePeriodsStore } from "@/stores/periods";
import { useHeadStore } from "@/stores/head";
import { useActivitiesStore } from "@/stores/activities";
import { useMovementsStore } from "@/stores/movements";

import ActivityLine from "@/containers/activities/ActivityLine.vue";
import AddActivityButton from "@/containers/activities/AddActivityButton.vue";
import MovementLine from "@/containers/movements/MovementLine.vue";
import ImportMovementsButton from "@/containers/movements/ImportMovementsButton.vue";
import PeriodAccountsSummary from "@/containers/periods/PeriodAccountsSummary.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import type { PeriodActivityData } from "@/types/periods";

const periodsStore = usePeriodsStore();
const { periodsActivityData } = storeToRefs(periodsStore);

const activitiesStore = useActivitiesStore();
const { activities } = storeToRefs(activitiesStore);

const movementsStore = useMovementsStore();
const { movements } = storeToRefs(movementsStore);

const headStore = useHeadStore();
headStore.updateTitle("Dashboard");

const router = useRouter();

const now = dayjs();

const currentPeriodActivityData = computed<PeriodActivityData>(() => {
  return periodsActivityData.value.find(
    (pad) => pad.month === now.month() && pad.year === now.year(),
  )!;
});

const lastActivities = computed(() => {
  return _.orderBy(
    activities.value,
    ["activity.date", "id"],
    ["desc", "desc"],
  ).slice(0, 10);
});

const lastMovements = computed(() => {
  return _.orderBy(movements.value, ["date", "id"], ["desc", "desc"]).slice(
    0,
    10,
  );
});

const periodFormatter = (month: number, year: number): string => {
  return dayjs().month(month).year(year).format("MMMM YYYY");
};

const goToPeriod = () => {
  router.push({ name: "period", params: { period: "current" } });
};
</script>

<template>
  <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
    <header
      class="h-14 border-b pl-14 pr-4 lg:pl-8 flex items-center flex-shrink-0"
    >
      <div class="text-sm font-semibold text-white truncate">Dashboard</div>
    </header>

    <div class="flex-1 overflow-y-auto">
      <div
        class="py-6 lg:py-8 px-2 xs:px-4 sm:px-6 lg:px-8 border-b relative mb-20"
      >
        <div class="flex items-center pb-8 px-1 my-4">
          <div>
            <div class="text-primary-100 text-xs mb-2 lg:mb-3">
              Current period
            </div>
            <div class="text-white font-bold text-3xl lg:text-4xl">
              {{ periodFormatter(now.month(), now.year()) }}
            </div>
          </div>

          <div class="flex-1" />

          <TBtn @click="goToPeriod">Go to period</TBtn>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border rounded-md bg-primary-800 relative -mb-24"
        >
          <div
            v-for="(activityType, index) in [
              {
                name: 'Balance',
                color: 'bg-indigo-300',
                value: currentPeriodActivityData.balance,
                isOverflowPositive: true,
              },
              {
                name: 'Revenue',
                color: 'bg-green-300',
                value: currentPeriodActivityData.revenue,
                isOverflowPositive: true,
              },
              {
                name: 'Expense',
                color: 'bg-red-300',
                value: currentPeriodActivityData.expense,
                isOverflowPositive: false,
              },
              {
                name: 'Investment',
                color: 'bg-orange-300',
                value: currentPeriodActivityData.investment,
                isOverflowPositive: true,
              },
            ]"
            :key="activityType.name"
            class="py-6 sm:py-8 px-6 border-b xl:border-b-0 border-primary-700"
            :class="index === 0 ? '' : 'sm:border-l'"
          >
            <div class="flex items-center">
              <div
                class="h-2.5 w-2.5 rounded-sm shrink-0 mr-2"
                :class="activityType.color"
              />
              <span class="text-white font-medium text-sm">
                {{ activityType.name }}
              </span>
            </div>

            <div
              class="whitespace-nowrap text-white font-semibold text-2xl lg:text-3xl mt-4 font-mono"
            >
              {{ getCurrencyFormatter().format(activityType.value) }}
            </div>
          </div>
        </div>
      </div>

      <div class="py-6 lg:py-8 px-2 xs:px-4 sm:px-6 lg:px-8 flex">
        <div class="grid grid-cols-6 flex-1 gap-4">
          <div
            class="@container h-full border rounded-md col-span-6 md:col-span-3 xl:col-span-4 overflow-hidden"
          >
            <div
              class="h-14 pl-4 @lg:pl-7 pr-2 @lg:pr-5 bg-primary-800 border-b flex items-center"
            >
              <div class="font-semibold text-white">Last activities</div>
              <div class="flex-1" />
              <AddActivityButton large />
            </div>

            <div class="h-[400px] border-b">
              <RouterLink
                v-for="activity in lastActivities"
                :key="activity.id"
                :to="{
                  name: 'activities',
                  params: { id: activity.number },
                }"
              >
                <ActivityLine :activity="activity" />
              </RouterLink>
            </div>
          </div>

          <div
            class="border rounded-md row-span-2 col-span-6 md:col-span-3 xl:col-span-2 overflow-hidden"
          >
            <div class="h-14 px-6 bg-primary-800 border-b flex items-center">
              <div class="font-semibold text-white">Accounts summary</div>
            </div>

            <PeriodAccountsSummary :period-date="now" no-filter />
          </div>

          <div
            class="@container h-full border rounded-md col-span-6 md:col-span-3 xl:col-span-4 overflow-hidden"
          >
            <div
              class="h-14 pl-4 @lg:pl-7 pr-2 @lg:pr-5 bg-primary-800 border-b flex items-center"
            >
              <div class="font-semibold text-white">Last movements</div>
              <div class="flex-1" />
              <ImportMovementsButton large />
            </div>

            <div class="h-[400px] border-b">
              <RouterLink
                v-for="movement in lastMovements"
                :key="movement.id"
                :to="{
                  name: 'movements',
                  params: { id: movement.id },
                }"
              >
                <MovementLine :movement="movement" />
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
