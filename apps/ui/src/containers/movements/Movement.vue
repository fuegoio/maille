<script lang="ts" setup>
import dayjs from "dayjs";
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useMotion } from "@vueuse/motion";

import AccountLabel from "@/components/AccountLabel.vue";

import AddActivityButton from "@/containers/activities/AddActivityButton.vue";

import { useMovementsStore } from "@/stores/movements";
import { useActivitiesStore } from "@/stores/activities";

import type { Movement } from "@maille/core/movements";

import { getCurrencyFormatter } from "@/utils/currency";
import type { UUID } from "crypto";
import { useEventsStore } from "@/stores/events";
import {
  deleteMovementMutation,
  updateMovementMutation,
} from "@/mutations/movements";
import _ from "lodash";
import { useRouter } from "vue-router";
import { useHotkey } from "@/hooks/use-hotkey";

const movementsStore = useMovementsStore();
const { focusedMovement } = storeToRefs(movementsStore);

const activitiesStore = useActivitiesStore();

const mainElement = ref<HTMLElement>();
const showMovement = ref(focusedMovement.value !== null);
const showProperties = ref(true);
const showActivities = ref(true);

const router = useRouter();

watch(focusedMovement, () => {
  if (focusedMovement.value !== null) {
    if (showMovement.value) return;

    showMovement.value = true;
    useMotion(mainElement, {
      initial: {
        marginLeft: window.innerWidth > 640 ? -576 : 0,
        x: 576,
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
  } else {
    useMotion(mainElement, {
      initial: {
        marginLeft: 0,
        x: 0,
      },
      enter: {
        marginLeft: window.innerWidth > 640 ? -576 : 0,
        x: 576,
        transition: {
          type: "spring",
          stiffness: 250,
          damping: 25,
          mass: 0.5,
        },
      },
    });

    setTimeout(() => {
      showMovement.value = false;
    }, 100);
  }
});

const movement = computed<Movement | undefined>(() => {
  if (focusedMovement.value === null) return;
  return movementsStore.getMovementById(focusedMovement.value);
});

const movementActivities = computed(() => {
  if (movement.value === undefined) return;
  return movement.value.activities.map((ma) => ({
    ...ma,
    activity: activitiesStore.getActivityById(ma.activity)!,
  }));
});

const handleMovementMenuClick = (event: string) => {
  if (focusedMovement.value === null) return;
  else if (movement.value === undefined) return;

  if (event === "delete") {
    const movementData = _.cloneDeep(movement.value);
    movementsStore.deleteMovement(focusedMovement.value);

    eventsStore.sendEvent({
      name: "deleteMovement",
      mutation: deleteMovementMutation,
      variables: {
        id: focusedMovement.value,
      },
      rollbackData: movementData,
    });

    close();
  }
};

const focusActivity = (activityNumber: number) => {
  router.push({ name: "activities", params: { id: activityNumber } });
};

const close = () => {
  focusedMovement.value = null;
};

const eventsStore = useEventsStore();

const updateMovement = (update: {
  date?: dayjs.Dayjs;
  name?: string;
  account?: UUID;
  amount?: number;
}) => {
  if (!movement.value) return;

  const movementData = _.cloneDeep(movement.value);
  movementsStore.updateMovement(movement.value!.id, update);

  eventsStore.sendEvent({
    name: "updateMovement",
    mutation: updateMovementMutation,
    variables: {
      id: movement.value.id,
      ...update,
      date: update.date?.format("YYYY-MM-DD"),
    },
    rollbackData: {
      ...movementData,
      date: movementData.date.format("YYYY-MM-DD"),
    },
  });
};

useHotkey(["Escape"], () => {
  close();
});
</script>

<template>
  <div
    v-if="showMovement"
    ref="mainElement"
    class="absolute top-0 left-0 @5xl:relative flex flex-col w-full @5xl:w-[575px] max-w-full h-full overflow-hidden border bg-primary-900 shadow-xl rounded"
  >
    <template v-if="movement">
      <div
        class="flex items-center px-4 sm:px-6 border-b w-full flex-shrink-0 h-14"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center w-6 h-8 ml-8 lg:ml-0 mr-4"
          @click="close"
        >
          <i
            class="mdi mdi-chevron-right mdi-24px transition hover:text-white"
          />
        </button>
        <div class="text-white text-sm font-medium">Movement</div>

        <div class="flex-1" />
        <TMenu
          class="mr-2 sm:mr-0"
          :items="[{ value: 'delete', text: 'Delete', icon: 'delete' }]"
          @click:item="handleMovementMenuClick($event)"
        />
      </div>

      <div class="px-4 sm:px-8 pt-6 mb-4 flex items-center">
        <div class="flex">
          <div
            class="text-sm border px-2.5 h-8 flex items-center text-primary-500 rounded -mx-2 bg-primary-700"
          >
            <AccountLabel :account-id="movement.account" />
          </div>
        </div>
      </div>

      <div
        class="px-4 sm:px-8 pb-6 border-b text-white min-w-0 font-bold text-lg"
      >
        {{ movement.name }}
      </div>

      <div class="py-6 px-4 sm:px-8 border-b">
        <div class="flex">
          <div
            class="-ml-2 text-sm font-medium px-2 rounded h-7 hover:text-white flex items-center"
            @click="showProperties = !showProperties"
          >
            Properties
            <i
              class="mdi ml-2"
              :class="showProperties ? 'mdi-menu-down' : 'mdi-menu-up'"
            />
          </div>
        </div>

        <div v-show="showProperties" class="pt-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm">Date</div>

            <TDatePicker
              :model-value="movement.date"
              borderless
              class="h-8 text-sm font-medium text-white"
              @update:model-value="updateMovement({ date: $event })"
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm">Amount</div>

            <TAmountInput
              :model-value="movement.amount"
              borderless
              class="h-8 text-sm font-medium text-white"
              @update:model-value="updateMovement({ amount: $event })"
            />
          </div>
        </div>
      </div>

      <div class="py-6 px-4 sm:px-8">
        <div class="flex">
          <div
            class="-ml-2 text-sm font-medium text-primary-100 px-2 rounded h-7 hover:text-white flex items-center"
            @click="showActivities = !showActivities"
          >
            Activities linked
            <i
              class="mdi ml-2"
              :class="showActivities ? 'mdi-menu-down' : 'mdi-menu-up'"
            />
          </div>

          <div class="flex-1" />

          <AddActivityButton
            v-if="showActivities"
            :movement="movement"
            class="-mr-2"
            @create="focusActivity"
          />
        </div>

        <div
          v-show="showActivities"
          class="mt-4 mb-2 bg-primary-800 -mx-4 rounded border"
        >
          <template
            v-for="(movementActivity, index) in movementActivities"
            :key="movementActivity.id"
          >
            <div
              class="h-10 flex items-center justify-center text-sm px-4 hover:bg-primary-600/20"
              :class="[index !== movementActivities!.length - 1 && 'border-b']"
              @click="focusActivity(movementActivity.activity.number)"
            >
              <div class="w-8 text-primary-100 hidden sm:block shrink-0">
                #{{ movementActivity.activity.number }}
              </div>
              <div class="hidden sm:block text-primary-100 w-20 shrink-0 ml-2">
                {{ dayjs(movementActivity.activity.date).format("DD/MM/YYYY") }}
              </div>
              <div class="sm:hidden text-primary-100 w-10 shrink-0">
                {{ dayjs(movementActivity.activity.date).format("DD/MM") }}
              </div>

              <div
                class="ml-1 text-white text-ellipsis overflow-hidden whitespace-nowrap"
              >
                {{ movementActivity.activity.name }}
              </div>
              <div class="flex-1" />
              <div
                class="w-20 whitespace-nowrap text-right text-white font-mono"
              >
                {{ getCurrencyFormatter().format(movementActivity.amount) }}
              </div>
            </div>
          </template>

          <div
            v-if="movementActivities!.length === 0"
            class="flex items-center justify-center text-primary-300 text-xs py-4"
          >
            No activity linked to this movement yet.
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
