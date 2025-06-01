<script setup lang="ts">
import dayjs from "dayjs";
import _ from "lodash";
import { computed } from "vue";
import { RecycleScroller } from "vue-virtual-scroller";
import LiabilityLine from "@/containers/liabilities/LiabilityLine.vue";
import LiabilitiesFilters from "@/containers/liabilities/filters/LiabilitiesFilters.vue";
import type { UUID } from "crypto";
import { useSearchStore } from "@/stores/search";
import { useViewsStore } from "@/stores/views";
import type { Liability } from "@maille/core/liabilities";
import { verifyLiabilityFilter } from "@maille/core/liabilities";

const { filterStringBySearch } = useSearchStore();
const viewsStore = useViewsStore();

const props = withDefaults(
  defineProps<{
    liabilities: Liability[];
    viewId: string;
    grouping?: "period" | null;
    accountFilter?: UUID | null;
  }>(),
  { grouping: null, accountFilter: null },
);

const liabilityView = computed(() => viewsStore.getLiabilityView(props.viewId));

type Group = {
  id: string;
  month: number;
  year: number;
};

type LiabilityAndGroup =
  | ({ itemType: "group" } & Group)
  | ({ itemType: "liability" } & Liability);

const liabilitiesFiltered = computed(() => {
  return props.liabilities
    .filter((liability) => filterStringBySearch(liability.name))
    .filter((liability) =>
      props.accountFilter !== null
        ? liability.account === props.accountFilter
        : true,
    )
    .filter((liability) => {
      if (liabilityView.value.filters.length === 0) return true;

      return liabilityView.value.filters
        .map((filter) => {
          return verifyLiabilityFilter(filter, liability);
        })
        .every((f) => f);
    })
    .map((l) => ({ ...l, id: l.id }));
});

const liabilitiesSorted = computed(() => {
  return _.orderBy(
    liabilitiesFiltered.value,
    ["activity.date", "id"],
    ["desc", "desc"],
  );
});

const liabilitiesWithGroups = computed<LiabilityAndGroup[]>(() => {
  const groups = liabilitiesSorted.value.reduce(
    (groups, l) => {
      const group = groups.find(
        (p) => p.month === l.date.month() && p.year === l.date.year(),
      );

      if (group) {
        group.liabilities.push(l);
      } else {
        groups.push({
          id: l.date.format("MM-YYYY"),
          month: l.date.month(),
          year: l.date.year(),
          liabilities: [l],
        });
      }

      return groups;
    },
    [] as {
      id: string;
      month: number;
      year: number;
      liabilities: Liability[];
    }[],
  );

  return _.orderBy(groups, ["year", "month"], ["desc", "desc"]).reduce(
    (lwg, group) => {
      lwg.push({
        itemType: "group",
        id: group.id,
        month: group.month,
        year: group.year,
      });
      return lwg.concat(
        group.liabilities.map((l) => ({ itemType: "liability", ...l })),
      );
    },
    [] as LiabilityAndGroup[],
  );
});

const periodFormatter = (month: number, year: number): string => {
  return dayjs().month(month).year(year).format("MMMM YYYY");
};
</script>

<template>
  <div class="flex flex-1 h-full overflow-x-hidden">
    <div class="flex flex-1 flex-col min-h-0 min-w-0">
      <LiabilitiesFilters
        :view-id="viewId"
        :liabilities="liabilitiesFiltered"
      />
      <div
        v-if="liabilitiesFiltered.length !== 0"
        class="flex-1 flex flex-col sm:min-w-[575px] overflow-x-hidden"
      >
        <template v-if="grouping">
          <RecycleScroller
            v-slot="{ item }"
            :items="liabilitiesWithGroups"
            :item-size="40"
            key-field="id"
            class="pb-40"
          >
            <div
              v-if="item.itemType === 'group'"
              class="bg-primary-800 h-10 flex items-center gap-2 pl-5 sm:pl-7 border-b flex-shrink-0"
            >
              <i class="mdi mdi-calendar-blank text-primary-100 mdi-16px" />
              <div class="text-sm font-medium">
                {{ periodFormatter(item.month, item.year) }}
              </div>
              <div class="flex-1" />
            </div>
            <LiabilityLine v-else :liability="item" />
          </RecycleScroller>
        </template>
        <RecycleScroller
          v-else
          v-slot="{ item }"
          :items="liabilitiesSorted"
          :item-size="40"
          key-field="id"
          class="pb-40"
        >
          <LiabilityLine :liability="item" />
        </RecycleScroller>
      </div>
      <div
        v-else
        class="flex flex-1 items-center justify-center overflow-hidden"
      >
        <div class="text-primary-700">No liability found</div>
      </div>
    </div>
  </div>
</template>
