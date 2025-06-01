<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useMotion } from "@vueuse/motion";

import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivitiesStore,
} from "@/stores/activities";

import { ActivityType } from "@maille/core/activities";

import ActivityTransactions from "@/containers/activities/ActivityTransactions.vue";
import ActivityMovements from "@/containers/activities/ActivityMovements.vue";
import ActivityLiabilities from "./ActivityLiabilities.vue";
import SplitActivityModal from "@/containers/activities/SplitActivityModal.vue";

import ActivityNameInput from "@/components/activities/ActivityNameInput.vue";
import ProjectSelect from "@/components/projects/ProjectSelect.vue";

import { getCurrencyFormatter } from "@/utils/currency";
import type dayjs from "dayjs";
import type { UUID } from "crypto";
import _ from "lodash";
import { useEventsStore } from "@/stores/events";
import {
  deleteActivityMutation,
  updateActivityMutation,
} from "@/mutations/activities";
import { useHotkey } from "@/hooks/use-hotkey";

const activitiesStore = useActivitiesStore();
const { categories, subcategories, focusedActivity } =
  storeToRefs(activitiesStore);

const mainElement = ref<HTMLElement>();
const showDeleteModal = ref(false);
const showSplitModal = ref(false);
const showActivity = ref(focusedActivity.value !== null);
const showProperties = ref(true);

watch(focusedActivity, () => {
  if (focusedActivity.value !== null) {
    if (showActivity.value) return;

    showActivity.value = true;
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
      showActivity.value = false;
    }, 100);
  }
});

const activity = computed(() => {
  if (focusedActivity.value === null) return;
  return activitiesStore.getActivityById(focusedActivity.value);
});

const handleActivityMenuClick = (event: string) => {
  if (event === "delete") {
    showDeleteModal.value = true;
  } else if (event === "split") {
    showSplitModal.value = true;
  }
};

const deleteActivity = () => {
  if (!activity.value) return;

  const activityId = activity.value.id;
  const activityData = activity.value;
  activitiesStore.deleteActivity(activityId);

  eventsStore.sendEvent({
    name: "deleteActivity",
    mutation: deleteActivityMutation,
    variables: {
      id: activityId,
    },
    rollbackData: activityData,
  });

  focusedActivity.value = null;
};

const close = () => {
  focusedActivity.value = null;
};

const eventsStore = useEventsStore();

const updateActivity = (update: {
  name?: string;
  description?: string | null;
  date?: dayjs.Dayjs;
  type?: ActivityType;
  category?: UUID | null;
  subcategory?: UUID | null;
  project?: UUID | null;
}) => {
  if (!activity.value) return;

  const activityData = _.cloneDeep(activity.value);
  activitiesStore.updateActivity(activity.value!.id, update);

  eventsStore.sendEvent({
    name: "updateActivity",
    mutation: updateActivityMutation,
    variables: {
      id: activity.value.id,
      ...update,
      date: update.date?.format("YYYY-MM-DD"),
    },
    rollbackData: {
      ...activityData,
      date: activityData.date.format("YYYY-MM-DD"),
    },
  });
};

useHotkey(["Escape"], () => {
  close();
});
</script>

<template>
  <div
    v-if="showActivity"
    ref="mainElement"
    class="absolute top-0 left-0 @5xl:relative flex flex-col w-full @5xl:w-[575px] max-w-full h-full overflow-hidden border bg-primary-900 shadow-xl rounded"
  >
    <template v-if="activity">
      <div
        class="flex items-center px-4 sm:px-6 border-b w-full flex-shrink-0 h-14"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center w-6 h-8 ml-8 lg:ml-0 mr-4"
          @click="close"
        >
          <i
            class="mdi mdi-chevron-right mdi-24px transition text-primary-100 hover:text-white"
          />
        </button>
        <div class="text-white text-sm font-medium">
          Activity #{{ activity.number }}
        </div>

        <div class="flex-1 block sm:hidden" />

        <TMenu
          class="mx-0.5 mt-1 sm:hidden"
          :items="[
            { value: 'split', text: 'Split', icon: 'content-cut' },
            { value: 'delete', text: 'Delete', icon: 'delete' },
          ]"
          @click:item="handleActivityMenuClick"
        />

        <div class="flex-1 hidden sm:flex items-center justify-end gap-3 mr-3">
          <button
            type="button"
            class="inline-flex items-center justify-center w-6 h-8"
            @click="showSplitModal = true"
          >
            <i
              class="mdi mdi-content-cut transition text-primary-100 hover:text-white"
            />
          </button>

          <TDeleteConfirmation
            v-model="showDeleteModal"
            description="Are you sure you want to delete this activity?"
            @confirm="deleteActivity"
          >
            <template #default="{ open }">
              <button
                type="button"
                class="inline-flex items-center justify-center w-6 h-8"
                @click="open"
              >
                <i
                  class="mdi mdi-delete transition text-primary-100 hover:text-white"
                />
              </button>
            </template>
          </TDeleteConfirmation>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pb-20">
        <div class="py-8 px-4 sm:px-8 border-b">
          <div
            class="flex items-center px-3 rounded-md w-fit h-7 -ml-2"
            :class="{
              'bg-primary-700': activity.status === 'scheduled',
              'bg-orange-300': activity.status === 'incomplete',
              'bg-emerald-300': activity.status === 'completed',
            }"
          >
            <span class="capitalize text-sm font-medium text-primary-800">
              {{ activity.status }}
            </span>
          </div>

          <div class="flex items-start mt-4">
            <div class="flex-1">
              <TDatePicker
                :model-value="activity.date"
                borderless
                class="font-semibold text-primary-100 text-sm h-8"
                @update:model-value="
                  (date: dayjs.Dayjs) => updateActivity({ date })
                "
              />
              <div class="flex items-start">
                <ActivityNameInput
                  :model-value="activity.name"
                  @update:model-value="(name) => updateActivity({ name })"
                />
                <div class="flex-1" />
                <div
                  class="font-semibold text-white text-right text-3xl pl-4 leading-snug whitespace-nowrap font-mono"
                >
                  {{ getCurrencyFormatter().format(activity.amount) }}
                </div>
              </div>

              <textarea
                :value="activity.description as string"
                name="activity-description"
                class="mt-2 text-sm border-none w-full text-primary-100 break-words resize-none bg-transparent placeholder:text-primary-700"
                placeholder="Add a description ..."
                @input="
                  (e) =>
                    updateActivity({
                      description: (e.target as HTMLTextAreaElement).value,
                    })
                "
              />
            </div>
          </div>
        </div>

        <div class="py-6 px-4 sm:px-8 border-b">
          <div class="flex">
            <div
              class="-ml-2 text-sm font-medium text-primary-100 px-2 rounded h-7 hover:text-white flex items-center transition-colors"
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
            <div class="flex justify-between items-center mb-2">
              <div class="text-sm">Activity type</div>

              <TSelect
                :model-value="activity.type"
                :items="[
                  { id: ActivityType.REVENUE, name: 'Revenue' },
                  { id: ActivityType.EXPENSE, name: 'Expense' },
                  { id: ActivityType.INVESTMENT, name: 'Investment' },
                  { id: ActivityType.NEUTRAL, name: 'Neutral' },
                ]"
                item-value="id"
                item-text="name"
                class="h-8 border-none -mr-2 focus:bg-primary-800"
                @update:model-value="
                  (type: ActivityType) => updateActivity({ type })
                "
              >
                <template #selected="{ item }">
                  <div class="flex items-center">
                    <div
                      class="size-3 rounded shrink-0 mr-3"
                      :class="`bg-${ACTIVITY_TYPES_COLOR[item.id as ActivityType]}-300`"
                    />
                    <span class="text-sm text-white">
                      {{ ACTIVITY_TYPES_NAME[item.id as ActivityType] }}
                    </span>
                  </div>
                </template>

                <template #item="{ item, selected }">
                  <div class="flex items-center">
                    <div
                      class="size-3 rounded shrink-0 mr-3"
                      :class="`bg-${ACTIVITY_TYPES_COLOR[item.id as ActivityType]}-300`"
                    />
                    <span class="text-sm text-white mb-[1px]">
                      {{ ACTIVITY_TYPES_NAME[item.id as ActivityType] }}
                    </span>
                  </div>
                </template>
              </TSelect>
            </div>

            <div class="flex justify-between items-center mb-2">
              <div class="text-sm">Category</div>

              <TSelect
                :model-value="activity.category"
                :items="categories.filter((c) => c.type === activity!.type)"
                item-value="id"
                item-text="name"
                placeholder="Category"
                :disabled="!activity.type"
                class="h-8 border-none -mr-2 focus:bg-primary-800"
                @update:model-value="
                  (category: UUID) => updateActivity({ category })
                "
              />
            </div>

            <div class="flex justify-between items-center mb-2">
              <div class="text-sm">Subcategory</div>

              <TSelect
                :model-value="activity.subcategory"
                :items="
                  subcategories.filter(
                    (sc) => sc.category === activity!.category,
                  )
                "
                item-value="id"
                item-text="name"
                placeholder="Subcategory"
                class="h-8 border-none -mr-2 focus:bg-primary-800"
                :disabled="activity.category === null"
                @update:model-value="
                  (subcategory: UUID) => updateActivity({ subcategory })
                "
              />
            </div>

            <div class="flex justify-between items-center mb-2">
              <div class="text-sm">Project</div>

              <ProjectSelect
                :model-value="activity.project"
                class="h-8 border-none -mr-2 focus:bg-primary-800"
                @update:model-value="(project) => updateActivity({ project })"
              />
            </div>
          </div>
        </div>

        <ActivityTransactions :activity="activity" />

        <ActivityMovements :activity="activity" />

        <ActivityLiabilities :activity="activity" />
      </div>

      <SplitActivityModal v-model="showSplitModal" :activity-id="activity.id" />
    </template>
  </div>
</template>
