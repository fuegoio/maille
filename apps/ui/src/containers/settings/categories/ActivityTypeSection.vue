<script setup lang="ts">
import _ from "lodash";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivitiesStore,
} from "@/stores/activities";
import type { ActivityType } from "@maille/core/activities";
import { useEventsStore } from "@/stores/events";
import {
  createActivityCategoryMutation,
  createActivitySubCategoryMutation,
  deleteActivityCategoryMutation,
  deleteActivitySubCategoryMutation,
} from "@/mutations/activities";
import type { UUID } from "crypto";

const activitiesStore = useActivitiesStore();
const { activities, categories, subcategories } = storeToRefs(activitiesStore);

const eventsStore = useEventsStore();

const props = defineProps<{ activityType: ActivityType }>();

const expanded = ref<UUID | null>(null);
const newCategory = ref({
  show: false,
  name: undefined as string | undefined,
});
const newSubCategory = ref({
  show: false,
  name: undefined as string | undefined,
});

const toggleExpand = (categoryId: UUID) => {
  if (expanded.value === categoryId) {
    expanded.value = null;
  } else {
    expanded.value = categoryId;
  }
  cancelNewSubCategory();
};

const sortedCategories = computed(() => {
  return _.orderBy(
    categories.value.filter((c) => c.type === props.activityType),
    ["name"],
  );
});

const cancelNewCategory = () => {
  newCategory.value.show = false;
  newCategory.value.name = undefined;
};

const cancelNewSubCategory = () => {
  newSubCategory.value.show = false;
  newSubCategory.value.name = undefined;
};

const addNewCategory = async () => {
  if (!newCategory.value.name) return;

  const category = activitiesStore.createCategory(
    newCategory.value.name,
    props.activityType,
    false,
  );

  eventsStore.sendEvent({
    name: "createActivityCategory",
    mutation: createActivityCategoryMutation,
    variables: {
      ...category,
      user: false,
    },
    rollbackData: undefined,
  });
  cancelNewCategory();
};

const addNewSubCategory = async () => {
  if (!newSubCategory.value.name) return;
  else if (expanded.value === null) return;

  const subcategory = activitiesStore.createSubCategory(
    newSubCategory.value.name,
    expanded.value,
    false,
  );

  eventsStore.sendEvent({
    name: "createActivitySubCategory",
    mutation: createActivitySubCategoryMutation,
    variables: {
      ...subcategory,
      user: false,
    },
    rollbackData: undefined,
  });
  cancelNewSubCategory();
};

const getActivitiesLinkedToCategory = (categoryId: UUID) => {
  return activities.value.filter((a) => a.category === categoryId).length;
};

const getActivitiesLinkedToSubCategory = (subcategoryId: UUID) => {
  return activities.value.filter((a) => a.subcategory === subcategoryId).length;
};

const deleteCategory = async (categoryId: UUID) => {
  const categoryActivities = activities.value
    .filter((a) => a.category === categoryId)
    .map((a) => a.id);
  const categoryActivitiesSubcategories = activities.value
    .filter((a) => a.category === categoryId)
    .map((a) => a.subcategory);
  const category = categories.value.find((c) => c.id === categoryId);
  if (!category) throw new Error("category not found");

  activitiesStore.deleteCategory(categoryId);

  eventsStore.sendEvent({
    name: "deleteActivityCategory",
    mutation: deleteActivityCategoryMutation,
    variables: { id: category.id },
    rollbackData: {
      category: category,
      activities: categoryActivities,
      activitiesSubcategories: categoryActivitiesSubcategories.reduce(
        (acc, sc) => {
          acc[sc!] = sc!;
          return acc;
        },
        {} as Record<UUID, UUID>,
      ),
    },
  });
};

const deleteSubCategory = async (subcategoryId: UUID) => {
  const subcategoryActivities = activities.value
    .filter((a) => a.subcategory === subcategoryId)
    .map((a) => a.id);
  const subcategory = subcategories.value.find((c) => c.id === subcategoryId);
  if (!subcategory) throw new Error("subcategory not found");

  activitiesStore.deleteSubCategory(subcategoryId);

  eventsStore.sendEvent({
    name: "deleteActivitySubCategory",
    mutation: deleteActivitySubCategoryMutation,
    variables: { id: subcategory.id },
    rollbackData: {
      subcategory: subcategory,
      activities: subcategoryActivities,
    },
  });
};
</script>

<template>
  <div class="pb-10">
    <div class="flex items-center mb-2 px-2">
      <div
        class="size-3 rounded mr-2 sm:mr-3 shrink-0"
        :class="`bg-${ACTIVITY_TYPES_COLOR[activityType]}-300`"
      />
      <div class="text-sm font-medium text-primary-400">
        {{ ACTIVITY_TYPES_NAME[activityType] }}
      </div>

      <div class="flex-1" />
      <button
        type="button"
        class="rounded hover:bg-primary-600 h-8 w-8 flex items-center justify-center group"
        @click="newCategory.show = true"
      >
        <i
          class="mdi mdi-plus text-primary-500 group-hover:text-primary-300 text-sm"
        />
      </button>
    </div>

    <div
      v-if="newCategory.show"
      class="w-full bg-primary-900 my-2 px-4 rounded h-12 flex items-center border"
    >
      <TTextField
        v-model="newCategory.name"
        placeholder="Name"
        autofocus
        dense
      />

      <div class="flex-1" />
      <TBtn outlined class="mr-2" @click="cancelNewCategory"> Cancel </TBtn>
      <TBtn @click="addNewCategory">Save</TBtn>
    </div>

    <div
      v-for="category in sortedCategories"
      :key="category.id"
      class="w-full border my-2 px-2 rounded group"
    >
      <div class="h-10 flex items-center w-full px-2">
        <div class="text-sm font-medium text-primary-200">
          {{ category.name }}
        </div>
        <div class="text-sm text-primary-600 ml-1">
          ·
          {{ getActivitiesLinkedToCategory(category.id) }}
          activities
        </div>

        <div class="flex-1" />

        <TDeleteConfirmation
          description="Are you sure you want to delete this category? All activities linked will loose this category and all subcategories will be deleted as well."
          @confirm="deleteCategory(category.id)"
        >
          <template #default="{ open }">
            <i
              class="mdi mdi-delete text-primary-700 hover:text-primary-300 text-sm mx-1 hidden group-hover:block"
              @click="open"
            />
          </template>
        </TDeleteConfirmation>

        <i
          class="mdi text-primary-500 hover:text-primary-300 text-sm ml-2"
          :class="
            expanded === category.id ? 'mdi-chevron-up' : 'mdi-chevron-down'
          "
          @click="toggleExpand(category.id)"
        />
      </div>

      <div v-if="expanded === category.id" class="border-t py-4">
        <div class="flex items-center mb-2 px-2">
          <div class="text-xs text-primary-600 font-medium">Subcategories</div>
          <div class="flex-1" />
          <button
            type="button"
            class="rounded hover:bg-primary-600 h-5 w-5 flex items-center justify-center group"
            @click="newSubCategory.show = true"
          >
            <i
              class="mdi mdi-plus text-primary-500 group-hover:text-primary-300 text-sm"
            />
          </button>
        </div>

        <div
          v-if="newSubCategory.show"
          class="w-full bg-primary-900 my-2 px-2 rounded h-12 flex items-center border"
        >
          <TTextField
            v-model="newSubCategory.name"
            placeholder="Name"
            autofocus
            dense
          />

          <div class="flex-1" />
          <TBtn outlined class="mr-2" @click="cancelNewSubCategory">
            Cancel
          </TBtn>
          <TBtn @click="addNewSubCategory">Save</TBtn>
        </div>
        <div
          v-else-if="
            subcategories.filter((sc) => sc.category === category.id).length ===
            0
          "
          class="text-xs text-primary-600 px-2"
        >
          No subcategory for this category.
        </div>

        <div
          v-for="subcategory in subcategories.filter(
            (sc) => sc.category === category.id,
          )"
          :key="subcategory.id"
          class="h-10 flex items-center w-full rounded bg-primary-950 px-2 my-2 border"
        >
          <div class="text-sm font-medium text-primary-400">
            {{ subcategory.name }}
          </div>
          <div class="text-sm text-primary-600 ml-1">
            ·
            {{ getActivitiesLinkedToSubCategory(subcategory.id) }}
            activities
          </div>

          <div class="flex-1" />

          <TDeleteConfirmation
            description="Are you sure you want to delete this subcategory? All activities linked will loose this subcategory."
            @confirm="deleteSubCategory(subcategory.id)"
          >
            <template #default="{ open }">
              <i
                class="mdi mdi-delete text-primary-700 hover:text-primary-300 text-sm mx-1"
                @click="open"
              />
            </template>
          </TDeleteConfirmation>
        </div>
      </div>
    </div>
  </div>
</template>
