<script setup lang="ts">
import dayjs from "dayjs";
import _ from "lodash";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, watch } from "vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";

import { useSearchStore } from "@/stores/search";
import { ACTIVITY_TYPES_COLOR, useActivitiesStore } from "@/stores/activities";
import { useViewsStore } from "@/stores/views";

import { ActivityType, type Activity } from "@maille/core/activities";

import ActivityLine from "@/containers/activities/ActivityLine.vue";
import ActivitiesFilters from "@/containers/activities/filters/ActivitiesFilters.vue";

import { getCurrencyFormatter } from "@/utils/currency";

import { verifyActivityFilter } from "@maille/core/activities";
import type { UUID } from "crypto";
import { useHotkey } from "@/hooks/use-hotkey";

const activitiesStore = useActivitiesStore();
const { showTransactions, focusedActivity } = storeToRefs(activitiesStore);

const { filterStringBySearch } = useSearchStore();
const viewsStore = useViewsStore();

const props = withDefaults(
  defineProps<{
    activities: Activity[];
    viewId: string;
    grouping?: "period" | null;
    accountFilter?: UUID | null;
    categoryFilter?: UUID | null;
    subcategoryFilter?: UUID | null;
    activityTypeFilter?: ActivityType | null;
    hideProject?: boolean;
  }>(),
  {
    grouping: null,
    accountFilter: null,
    categoryFilter: null,
    subcategoryFilter: null,
    activityTypeFilter: null,
    hideProject: false,
  },
);
const activityView = computed(() => viewsStore.getActivityView(props.viewId));

onBeforeUnmount(() => {
  showTransactions.value = false;
  focusedActivity.value = null;
});

type Group = {
  id: string;
  month: number;
  year: number;
  total: {
    [ActivityType.EXPENSE]?: number;
    [ActivityType.REVENUE]?: number;
    [ActivityType.INVESTMENT]?: number;
  };
};

type ActivityAndGroup =
  | ({ itemType: "group" } & Group)
  | ({ itemType: "activity" } & Activity);

const activitiesFiltered = computed(() => {
  return props.activities
    .filter((activity) => filterStringBySearch(activity.name))
    .filter((activity) => {
      if (props.subcategoryFilter !== null) {
        return activity.subcategory === props.subcategoryFilter;
      }

      if (props.categoryFilter !== null) {
        return activity.category === props.categoryFilter;
      }

      return true;
    })
    .filter((activity) => {
      if (props.accountFilter !== null) {
        return (
          activity.transactions.filter(
            (t) =>
              t.toAccount === props.accountFilter ||
              t.fromAccount === props.accountFilter,
          ).length > 0
        );
      } else {
        return true;
      }
    })
    .filter((activity) =>
      props.activityTypeFilter !== null
        ? activity.type === props.activityTypeFilter
        : true,
    )
    .filter((activity) => {
      if (activityView.value.filters.length === 0) return true;

      return activityView.value.filters
        .map((filter) => {
          return verifyActivityFilter(filter, activity);
        })
        .every((f) => f);
    });
});

const activitiesSorted = computed(() => {
  return _.orderBy(
    activitiesFiltered.value,
    ["activity.date", "id"],
    ["desc", "desc"],
  );
});

const activitiesWithGroups = computed<ActivityAndGroup[]>(() => {
  const groups = activitiesSorted.value.reduce(
    (groups, a) => {
      let group = groups.find(
        (p) => p.month === a.date.month() && p.year === a.date.year(),
      );

      if (group) {
        group.activities.push(a);
      } else {
        group = {
          id: a.date.format("MM-YYYY"),
          month: a.date.month(),
          year: a.date.year(),
          total: {},
          activities: [a],
        };
        groups.push(group);
      }

      if (a.type !== ActivityType.NEUTRAL) {
        if (group.total[a.type] === undefined) {
          group.total[a.type] = a.amount;
        } else {
          group.total[a.type]! += a.amount;
        }
      }

      return groups;
    },
    [] as (Group & { activities: Activity[] })[],
  );

  return _.orderBy(groups, ["year", "month"], ["desc", "desc"]).reduce(
    (awg, group) => {
      awg.push({
        itemType: "group",
        ...group,
      });
      return awg.concat(
        group.activities.map((a) => ({ itemType: "activity", ...a })),
      );
    },
    [] as ActivityAndGroup[],
  );
});

const periodFormatter = (month: number, year: number): string => {
  return dayjs().month(month).year(year).format("MMMM YYYY");
};

watch(focusedActivity, () => {
  if (
    focusedActivity.value !== null &&
    !activitiesFiltered.value.map((ad) => ad.id).includes(focusedActivity.value)
  ) {
    focusedActivity.value = null;
  }
});

const handleActivityClick = (activityId: UUID) => {
  if (focusedActivity.value === activityId) {
    focusedActivity.value = null;
  } else {
    focusedActivity.value = activityId;
  }
};

useHotkey(["j"], () => {
  const activities = activitiesFiltered.value;
  if (activities.length === 0) return;

  const currentIndex = activities.findIndex(
    (activity) => activity.id === focusedActivity.value,
  );

  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex - 1 + activities.length) % activities.length;
  focusedActivity.value = activities[nextIndex].id;
});

useHotkey(["k"], () => {
  const activities = activitiesFiltered.value;
  if (activities.length === 0) return;

  const currentIndex = activities.findIndex(
    (activity) => activity.id === focusedActivity.value,
  );

  const nextIndex = (currentIndex + 1) % activities.length;
  focusedActivity.value = activities[nextIndex].id;
});
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
    <ActivitiesFilters
      :view-id="activityView.id"
      :activities="activitiesFiltered"
    />

    <div class="flex flex-1 h-full overflow-x-hidden">
      <div class="flex flex-1 flex-col min-h-0 min-w-0">
        <div
          v-if="activitiesFiltered.length !== 0"
          class="flex flex-col sm:min-w-[575px] overflow-x-hidden"
        >
          <template v-if="grouping">
            <DynamicScroller
              :items="activitiesWithGroups"
              :min-item-size="41"
              key-field="id"
              class="pb-40"
            >
              <template #default="{ item, index, active }">
                <DynamicScrollerItem
                  :item="item"
                  :active="active"
                  :size-dependencies="[showTransactions]"
                  :data-index="index"
                >
                  <div
                    v-if="item.itemType === 'group'"
                    class="bg-primary-800 h-10 flex items-center gap-2 pl-5 sm:pl-7 pr-2 sm:pr-6 flex-shrink-0 border-b"
                  >
                    <i
                      class="mdi mdi-calendar-blank text-primary-100 mdi-16px"
                    />
                    <div class="text-sm font-medium">
                      {{ periodFormatter(item.month, item.year) }}
                    </div>

                    <div class="flex-1" />

                    <template
                      v-for="activityType in [
                        ActivityType.INVESTMENT,
                        ActivityType.REVENUE,
                        ActivityType.EXPENSE,
                      ]"
                      :key="activityType"
                    >
                      <div
                        v-if="item.total[activityType]"
                        class="text-sm text-white text-right sm:flex items-center pl-4 hidden font-mono"
                      >
                        <div
                          class="h-[9px] w-[9px] rounded-xs shrink-0 mr-3 mt-[2px]"
                          :class="`bg-${ACTIVITY_TYPES_COLOR[activityType]}-300`"
                        />
                        {{
                          getCurrencyFormatter().format(
                            item.total[activityType],
                          )
                        }}
                      </div>
                    </template>
                  </div>
                  <ActivityLine
                    v-else
                    :activity="item"
                    :account-filter="accountFilter"
                    :hide-project="hideProject"
                    @click.prevent="handleActivityClick(item.id)"
                  />
                </DynamicScrollerItem>
              </template>
            </DynamicScroller>
          </template>
          <DynamicScroller
            v-else
            :items="activitiesSorted"
            :min-item-size="41"
            key-field="id"
            class="pb-40"
          >
            <template #default="{ item, index, active }">
              <DynamicScrollerItem
                :item="item"
                :active="active"
                :size-dependencies="[showTransactions]"
                :data-index="index"
              >
                <ActivityLine
                  :activity="item"
                  :account-filter="accountFilter"
                  :hide-project="hideProject"
                  @click.prevent="handleActivityClick(item.id)"
                />
              </DynamicScrollerItem>
            </template>
          </DynamicScroller>
        </div>
        <div
          v-else
          class="flex flex-1 items-center justify-center overflow-hidden"
        >
          <div class="text-primary-600">No activity found</div>
        </div>
      </div>
    </div>
  </div>
</template>
