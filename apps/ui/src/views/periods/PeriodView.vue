<script setup lang="ts">
import dayjs, { Dayjs } from "dayjs";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMotion } from "@vueuse/motion";

import { useActivitiesStore } from "@/stores/activities";
import { usePeriodsStore } from "@/stores/periods";
import { useMovementsStore } from "@/stores/movements";
import { useHeadStore } from "@/stores/head";
import { useViewsStore } from "@/stores/views";

import ActivitiesTable from "@/containers/activities/ActivitiesTable.vue";
import MovementsTable from "@/containers/movements/MovementsTable.vue";
import PeriodAccountsSummary from "@/containers/periods/PeriodAccountsSummary.vue";
import PeriodActivitiesSummary from "@/containers/periods/PeriodActivitiesSummary.vue";
import PeriodsMenu from "@/containers/periods/PeriodsMenu.vue";
import SearchBar from "@/containers/SearchBar.vue";
import FilterActivitiesButton from "@/containers/activities/filters/FilterActivitiesButton.vue";
import ExportActivitiesButton from "@/containers/activities/ExportActivitiesButton.vue";
import ActivityView from "@/containers/activities/Activity.vue";
import MovementVue from "@/containers/movements//Movement.vue";

import ShowTransactionsButton from "@/components/activities/ShowTransactionsButton.vue";
import PeriodLabel from "@/components/periods/PeriodLabel.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import type { PeriodActivityData } from "@/types/periods";
import LiabilitiesTable from "@/containers/liabilities/LiabilitiesTable.vue";
import { useLiabilitiesStore } from "@/stores/liabilities";
import FilterMovementsButton from "@/containers/movements/filters/FilterMovementsButton.vue";

const router = useRouter();
const route = useRoute();

const viewsStore = useViewsStore();

const headStore = useHeadStore();

const activitiesStore = useActivitiesStore();
const { activities, focusedActivity } = storeToRefs(activitiesStore);

const movementsStore = useMovementsStore();
const { movements, focusedMovement } = storeToRefs(movementsStore);

const liabilitiesStore = useLiabilitiesStore();
const { liabilities } = storeToRefs(liabilitiesStore);

const periodsStore = usePeriodsStore();
const {
  viewFilters,
  periodsAvailable,
  periodsActivityData,
  periodsForecastData,
} = storeToRefs(periodsStore);

const currentView = ref<"activities" | "movements" | "liabilities">(
  "activities",
);
const currentDrawerSummaryView = ref<"activities" | "accounts">("activities");

const periodDate = computed(() => {
  let periodDate: Dayjs;
  const period = route.params.period as string;
  if (period === "current") periodDate = dayjs();
  else if (period === "past") periodDate = dayjs().subtract(1, "month");
  else periodDate = dayjs(period);

  return periodDate;
});

watch(
  () => route.params.period,
  () => {
    if (route.name !== "period") return;

    if (route.params.period != "current" && route.params.period != "past") {
      if (!periodDate.value.isValid()) {
        router.replace({ name: "periods" });
        return;
      }

      const now = dayjs();
      if (
        periodDate.value.month() === now.month() &&
        periodDate.value.year() === now.year()
      ) {
        router.replace({ name: "period", params: { period: "current" } });
        return;
      }

      const pastPeriod = now.subtract(1, "month");
      if (
        periodDate.value.month() === pastPeriod.month() &&
        periodDate.value.year() === pastPeriod.year()
      ) {
        router.replace({ name: "period", params: { period: "past" } });
        return;
      }
    }

    if (
      !periodsAvailable.value.find(
        (p) =>
          p.month === periodDate.value.month() &&
          p.year === periodDate.value.year(),
      )
    ) {
      router.replace({ name: "periods" });
      return;
    }

    headStore.updateTitle(periodDate.value.format("MMMM YYYY"));
  },
  { immediate: true },
);

const activityView = computed(() => {
  return viewsStore.getActivityView(`period-page`);
});

const movementsView = computed(() => {
  return viewsStore.getMovementView(`period-page`);
});

const label = computed(() =>
  periodsStore.getPeriodLabel({
    month: periodDate.value.month(),
    year: periodDate.value.year(),
  }),
);

const periodActivities = computed(() => {
  return activities.value.filter(
    (activity) =>
      activity.date.month() === periodDate.value.month() &&
      activity.date.year() === periodDate.value.year(),
  );
});

const periodMovements = computed(() => {
  return movements.value.filter(
    (movement) =>
      movement.date.month() === periodDate.value.month() &&
      movement.date.year() === periodDate.value.year(),
  );
});

const periodLiabilities = computed(() => {
  return liabilities.value
    .filter(
      (liability) =>
        !!liability.activity &&
        periodActivities.value.map((a) => a.id).includes(liability.activity),
    )
    .filter((liability) => liability.amount != 0);
});

const periodActivityData = computed<PeriodActivityData | undefined>(() => {
  return periodsActivityData.value.find(
    (p) =>
      p.month === periodDate.value.month() &&
      p.year === periodDate.value.year(),
  );
});

const periodForecastData = computed<PeriodActivityData | undefined>(() => {
  return periodsForecastData.value?.find(
    (p) =>
      p.month === periodDate.value.month() &&
      p.year === periodDate.value.year(),
  );
});

const previousPeriodActivityData = computed<PeriodActivityData | undefined>(
  () => {
    return periodsActivityData.value.find(
      (p) =>
        p.month === periodDate.value.subtract(1, "month").month() &&
        p.year === periodDate.value.subtract(1, "month").year(),
    );
  },
);

const resetFilters = () => {
  viewFilters.value = {
    category: null,
    subcategory: null,
    activityType: null,
    account: null,
  };
};

onBeforeUnmount(() => {
  resetFilters();
});

// Drawer

const drawerElement = ref<HTMLElement>();
const isDrawerOpen = ref(window.innerWidth > 420);

const toggleDrawer = () => {
  if (isDrawerOpen.value) {
    useMotion(drawerElement, {
      initial: {
        marginLeft: 0,
        x: 0,
      },
      enter: {
        marginLeft: -460,
        x: 460,
        transition: {
          type: "spring",
          stiffness: 250,
          damping: 25,
          mass: 0.5,
        },
      },
    });

    setTimeout(() => {
      isDrawerOpen.value = false;
    }, 100);
  } else {
    isDrawerOpen.value = true;
    useMotion(drawerElement, {
      initial: {
        marginLeft: -460,
        x: 460,
      },
      enter: {
        marginLeft: 0,
        x: 0,
        transition: {
          type: "spring",
          stiffness: 250,
          damping: 25,
          mass: 0.5,
        },
      },
    });
  }
};

watch(focusedActivity, () => {
  if (focusedActivity.value) {
    isDrawerOpen.value = false;
  }
});

watch(focusedMovement, () => {
  if (focusedMovement.value) {
    isDrawerOpen.value = false;
  }
});
</script>

<template>
  <template v-if="periodDate.isValid() && periodActivityData">
    <div class="flex flex-1 flex-col rounded shadow-xl border bg-primary-900">
      <header
        class="h-14 border-b pl-8 pr-4 lg:pl-2 flex items-center shrink-0"
      >
        <PeriodsMenu />

        <div class="flex-1" />
        <SearchBar />

        <TTooltip text="Show period side panel">
          <button
            type="button"
            class="ml-2 sm:ml-0 inline-flex items-center justify-center transition text-primary-100 hover:text-white hover:bg-primary-800 rounded h-7 w-7"
            :class="
              isDrawerOpen ? 'bg-primary-800 text-white' : 'bg-transparent'
            "
            @click="toggleDrawer"
          >
            <i class="mdi mdi-view-split-vertical text-lg" />
          </button>
        </TTooltip>
      </header>

      <div class="flex flex-1 w-full overflow-x-hidden">
        <div class="flex flex-1 flex-col min-w-0">
          <div class="flex items-center h-10 border-b px-4">
            <div class="flex items-center gap-3 pl-2">
              <button
                type="button"
                class="inline-flex items-center justify-center transition-colors hover:text-white hover:bg-primary-700 rounded h-6 px-2 text-xs border font-medium"
                :class="
                  currentView === 'activities'
                    ? 'bg-primary-700 text-white'
                    : 'bg-transparent text-primary-600'
                "
                @click="currentView = 'activities'"
              >
                Activities
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center transition-colors hover:text-white hover:bg-primary-700 rounded h-6 px-2 text-xs border font-medium"
                :class="
                  currentView === 'movements'
                    ? 'bg-primary-700 text-white'
                    : 'bg-transparent text-primary-600'
                "
                @click="currentView = 'movements'"
              >
                Movements
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center transition-colors hover:text-white hover:bg-primary-700 rounded h-6 px-2 text-xs border font-medium"
                :class="
                  currentView === 'liabilities'
                    ? 'bg-primary-700 text-white'
                    : 'bg-transparent text-primary-600'
                "
                @click="currentView = 'liabilities'"
              >
                Liabilities
              </button>
            </div>

            <div class="flex-1" />

            <template
              v-if="
                currentView === 'activities' &&
                activityView.filters.length === 0
              "
            >
              <FilterActivitiesButton :view-id="activityView.id" class="mx-2" />
              <ExportActivitiesButton
                class="mr-1"
                :view-id="activityView.id"
                :activities="periodActivities"
              />
              <div class="mx-3 w-[1px] bg-primary-700 h-5" />
              <ShowTransactionsButton />
            </template>
            <template
              v-else-if="
                currentView === 'movements' &&
                movementsView.filters.length === 0
              "
            >
              <FilterMovementsButton :view-id="movementsView.id" class="mx-2" />
            </template>
          </div>

          <ActivitiesTable
            v-if="currentView === 'activities'"
            :activities="periodActivities"
            :account-filter="viewFilters.account"
            :category-filter="viewFilters.category"
            :subcategory-filter="viewFilters.subcategory"
            :activity-type-filter="viewFilters.activityType"
            :view-id="activityView.id"
          />
          <MovementsTable
            v-else-if="currentView === 'movements'"
            :movements="periodMovements"
            :account-filter="viewFilters.account"
            :view-id="movementsView.id"
          />
          <LiabilitiesTable
            v-else-if="currentView === 'liabilities'"
            :liabilities="periodLiabilities"
            :account-filter="viewFilters.account"
            hide-periods
          />
        </div>
      </div>
    </div>

    <div
      v-if="isDrawerOpen"
      ref="drawerElement"
      class="relative flex flex-col items-center w-full shrink-0 sm:max-w-[460px] h-full overflow-y-auto pb-10 border bg-primary-900 shadow-xl rounded"
    >
      <div class="border-b p-6 w-full flex items-center">
        <div class="text-lg text-white font-bold flex-1">
          {{ periodDate.format("MMMM YYYY") }}
        </div>
        <PeriodLabel
          class="ml-4"
          :period="{ month: periodDate.month(), year: periodDate.year() }"
        />
      </div>

      <div class="border-b p-6 pb-12 mb-6 w-full relative">
        <div class="flex items-center">
          <div class="text-primary-100 font-medium">Total</div>
          <div class="flex-1" />

          <template v-if="previousPeriodActivityData">
            <span class="text-white text-lg font-mono">
              {{
                getCurrencyFormatter().format(
                  previousPeriodActivityData.balance,
                )
              }}
            </span>
            <i class="mdi mdi-arrow-right mx-2 text-white" />
          </template>
          <span class="font-semibold text-white text-lg font-mono">
            {{ getCurrencyFormatter().format(periodActivityData.balance) }}
          </span>
        </div>

        <div class="flex items-center mt-3 text-sm">
          <div class="text-primary-100 font-medium">Earnings</div>
          <div class="flex-1" />
          <span class="font-medium text-white font-mono">
            <i
              class="mdi"
              :class="
                periodActivityData.revenue > periodActivityData.expense
                  ? 'mdi-plus-circle text-emerald-400'
                  : 'mdi-minus-circle text-red-400'
              "
            />
            {{
              getCurrencyFormatter().format(
                periodActivityData.revenue - periodActivityData.expense,
              )
            }}
          </span>
        </div>

        <div
          v-if="label === 'Future' && periodForecastData !== undefined"
          class="flex items-center text-sm mt-2"
        >
          <div class="text-primary-100 font-medium">Forecast</div>
          <div class="flex-1" />

          <span class="text-white font-medium font-mono">
            {{ getCurrencyFormatter().format(periodForecastData.balance) }}
          </span>
        </div>

        <div class="w-full px-8 absolute -bottom-4 left-0">
          <div class="flex items-center w-full bg-primary-800 rounded border">
            <button
              type="button"
              class="inline-flex items-center justify-center transition hover:text-white rounded h-8 px-2 text-xs flex-grow border-r font-medium"
              :class="[
                currentDrawerSummaryView === 'activities'
                  ? 'bg-primary-700 text-white'
                  : 'bg-transparent text-primary-100',
              ]"
              @click="
                currentDrawerSummaryView = 'activities';
                resetFilters();
              "
            >
              Activities
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center transition hover:text-white rounded h-8 px-2 text-xs flex-grow font-medium"
              :class="
                currentDrawerSummaryView === 'accounts'
                  ? 'bg-primary-700 text-white'
                  : 'bg-transparent text-primary-100'
              "
              @click="
                currentDrawerSummaryView = 'accounts';
                resetFilters();
              "
            >
              Accounts
            </button>
          </div>
        </div>
      </div>

      <PeriodActivitiesSummary
        v-if="currentDrawerSummaryView === 'activities'"
        :period-date="periodDate"
      />
      <PeriodAccountsSummary v-else :period-date="periodDate" />
    </div>

    <ActivityView />
    <MovementVue />
  </template>
</template>
