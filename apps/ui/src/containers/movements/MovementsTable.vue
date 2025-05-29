<script setup lang="ts">
import dayjs from "dayjs";
import _ from "lodash";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RecycleScroller } from "vue-virtual-scroller";

import MovementLine from "@/containers/movements/MovementLine.vue";

import { useMovementsStore } from "@/stores/movements";
import { useSearchStore } from "@/stores/search";
import { useActivitiesStore } from "@/stores/activities";
import { useViewsStore } from "@/stores/views";

import type { Movement } from "@maille/core/movements";
import { verifyMovementFilter } from "@maille/core/movements";
import { storeToRefs } from "pinia";
import type { UUID } from "crypto";
import { useHotkey } from "@/hooks/use-hotkey";
import MovementsFilters from "./filters/MovementsFilters.vue";
import MovementsActions from "./MovementsActions.vue";

const movementsStore = useMovementsStore();
const { focusedMovement } = storeToRefs(movementsStore);

const activitiesStore = useActivitiesStore();
const { focusedActivity } = storeToRefs(activitiesStore);

const { filterStringBySearch } = useSearchStore();
const viewsStore = useViewsStore();

const props = withDefaults(
  defineProps<{
    movements: Movement[];
    viewId: string;
    grouping?: "period" | null;
    accountFilter?: UUID | null;
  }>(),
  { grouping: null, accountFilter: null },
);

const movementView = computed(() => viewsStore.getMovementView(props.viewId));
const selectedMovements = ref<UUID[]>([]);

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
    )
    .filter((movement) => {
      if (movementView.value.filters.length === 0) return true;

      return movementView.value.filters
        .map((filter) => {
          return verifyMovementFilter(filter, movement);
        })
        .every((f) => f);
    });
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
    (movement) => movement.id === focusedMovement.value,
  );

  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex - 1 + movements.length) % movements.length;
  focusedMovement.value = movements[nextIndex].id;
});

useHotkey(["k"], () => {
  const movements = movementsFiltered.value;
  if (movements.length === 0) return;

  const currentIndex = movements.findIndex(
    (movement) => movement.id === focusedMovement.value,
  );

  const nextIndex = (currentIndex + 1) % movements.length;
  focusedMovement.value = movements[nextIndex].id;
});

const selectMovement = (movementId: UUID) => {
  if (selectedMovements.value.includes(movementId)) {
    selectedMovements.value = selectedMovements.value.filter(
      (id) => id !== movementId,
    );
  } else {
    selectedMovements.value.push(movementId);
  }
};

useHotkey(["Escape"], () => {
  if (selectedMovements.value.length > 0) {
    selectedMovements.value = [];
  }
});

useHotkey(
  (e) => e.key === "a" && (e.metaKey || e.ctrlKey),
  () => {
    selectedMovements.value = movementsFiltered.value.map((m) => m.id);
  },
);
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0 min-w-0">
    <MovementsFilters :view-id="viewId" :movements="movementsFiltered" />

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
            :is-movement-selected="selectedMovements.includes(item.id)"
            @select-movement="selectMovement(item.id)"
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
          :is-movement-selected="selectedMovements.includes(item.id)"
          @select-movement="selectMovement(item.id)"
          @click.prevent="handleMovementClick(item.id)"
        />
      </RecycleScroller>
    </div>
    <div v-else class="flex flex-1 items-center justify-center overflow-hidden">
      <div class="text-primary-600">No movement found</div>
    </div>
  </div>

  <MovementsActions
    :selected-movements="selectedMovements"
    @clear-selection="selectedMovements = []"
  />
</template>
