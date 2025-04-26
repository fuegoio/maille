<script setup lang="ts">
import dayjs from "dayjs";
import _ from "lodash";
import { computed, onBeforeUnmount, watch } from "vue";
import { RecycleScroller } from "vue-virtual-scroller";

import MovementLine from "@/containers/movements/MovementLine.vue";

import { useMovementsStore } from "@/stores/movements";
import { useSearchStore } from "@/stores/search";
import { useActivitiesStore } from "@/stores/activities";

import type { Movement } from "@maille/core/movements";
import { storeToRefs } from "pinia";
import type { UUID } from "crypto";
import { useHotkey } from "@/hooks/use-hotkey";

const movementsStore = useMovementsStore();
const { focusedMovement } = storeToRefs(movementsStore);

const activitiesStore = useActivitiesStore();
const { focusedActivity } = storeToRefs(activitiesStore);

const { filterStringBySearch } = useSearchStore();

const props = withDefaults(
  defineProps<{
    movements: Movement[];
    grouping?: "period" | null;
    accountFilter?: UUID | null;
  }>(),
  { grouping: null, accountFilter: null },
);

onBeforeUnmount(() => {
  focusedMovement.value = null;
  focusedActivity.value = null;
});

watch(focusedMovement, () => {
  focusedActivity.value = null;
});

type Group = {
  id: string;
  month: number;
  year: number;
};

type MovementAndGroup =
  | ({ itemType: "group" } & Group)
  | ({ itemType: "movement" } & Movement);

const movementsFiltered = computed(() => {
  return props.movements
    .filter((movement) => filterStringBySearch(movement.name))
    .filter((movement) =>
      props.accountFilter !== null
        ? movement.account === props.accountFilter
        : true,
    );
});

const movementsSorted = computed(() => {
  return _.orderBy(movementsFiltered.value, ["date", "id"], ["desc", "desc"]);
});

const movementsWithGroups = computed<MovementAndGroup[]>(() => {
  const groups = movementsSorted.value.reduce(
    (groups, m) => {
      const group = groups.find(
        (p) => p.month === m.date.month() && p.year === m.date.year(),
      );

      if (group) {
        group.movements.push(m);
      } else {
        groups.push({
          id: m.date.format("MM-YYYY"),
          month: m.date.month(),
          year: m.date.year(),
          movements: [m],
        });
      }

      return groups;
    },
    [] as { id: string; month: number; year: number; movements: Movement[] }[],
  );

  return _.orderBy(groups, ["year", "month"], ["desc", "desc"]).reduce(
    (mwg, group) => {
      mwg.push({
        itemType: "group",
        id: group.id,
        month: group.month,
        year: group.year,
      });
      return mwg.concat(
        group.movements.map((m) => ({ itemType: "movement", ...m })),
      );
    },
    [] as MovementAndGroup[],
  );
});

const periodFormatter = (month: number, year: number): string => {
  return dayjs().month(month).year(year).format("MMMM YYYY");
};

const handleMovementClick = (movementId: UUID) => {
  if (focusedMovement.value === movementId) {
    focusedMovement.value = null;
  } else {
    focusedMovement.value = movementId;
  }
};

useHotkey(["j"], () => {
  const movements = movementsFiltered.value;
  if (movements.length === 0) return;

  const currentIndex = movements.findIndex(
    (movement) => movement.id === focusedMovement.value
  );

  const nextIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + movements.length) % movements.length;
  focusedMovement.value = movements[nextIndex].id;
});

useHotkey(["k"], () => {
  const movements = movementsFiltered.value;
  if (movements.length === 0) return;

  const currentIndex = movements.findIndex(
    (movement) => movement.id === focusedMovement.value
  );

  const nextIndex = (currentIndex + 1) % movements.length;
  focusedMovement.value = movements[nextIndex].id;
});
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0 min-w-0">
    <div
      v-if="movementsFiltered.length !== 0"
      class="flex-1 flex flex-col sm:min-w-[575px] overflow-x-hidden"
    >
      <template v-if="grouping">
        <RecycleScroller
          v-slot="{ item }"
          :items="movementsWithGroups"
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
          <MovementLine
            v-else
            :movement="item"
            @click.prevent="handleMovementClick(item.id)"
          />
        </RecycleScroller>
      </template>
      <RecycleScroller
        v-else
        v-slot="{ item }"
        :items="movementsSorted"
        :item-size="40"
        key-field="id"
        class="pb-40"
      >
        <MovementLine
          :movement="item"
          @click.prevent="handleMovementClick(item.id)"
        />
      </RecycleScroller>
    </div>
    <div v-else class="flex flex-1 items-center justify-center overflow-hidden">
      <div class="text-primary-600">No movement found</div>
    </div>
  </div>
</template>
