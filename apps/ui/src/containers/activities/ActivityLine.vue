<script setup lang="ts">
import dayjs from "dayjs";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import type { UUID } from "crypto";

import AccountLabel from "@/components/AccountLabel.vue";

import { ACTIVITY_TYPES_COLOR, useActivitiesStore } from "@/stores/activities";
import { useProjectsStore } from "@/stores/projects";

import type { Activity } from "@maille/core/activities";

import { getCurrencyFormatter } from "@/utils/currency";

const activitiesStore = useActivitiesStore();
const { categories, subcategories, showTransactions, focusedActivity } =
  storeToRefs(activitiesStore);

const projectsStore = useProjectsStore();

const props = withDefaults(
  defineProps<{
    activity: Activity;
    accountFilter?: UUID | null;
    hideProject?: boolean;
  }>(),
  { accountFilter: null, hideProject: false },
);

const transactions = computed(() => {
  return props.activity.transactions.filter((t) =>
    props.accountFilter !== null
      ? t.fromAccount === props.accountFilter || t.toAccount === props.accountFilter
      : true,
  );
});
</script>

<template>
  <div
    class="block overflow-hidden border-b shrink-0 group transition-colors"
    :class="[
      focusedActivity === activity.id
        ? 'bg-primary-800/50 border-l-4 border-l-accent'
        : 'hover:bg-primary-800/50 pl-1',
    ]"
    :style="`height: ${showTransactions ? 40 * (1 + transactions.length) + 'px' : '40px'}`"
  >
    <div class="h-10 flex items-center gap-2 pl-3 pr-2 @lg:pr-6 @lg:pl-1 text-sm">
      <div class="hidden @lg:block text-primary-100 w-20 shrink-0 ml-4">
        {{ dayjs(activity.date).format("DD/MM/YYYY") }}
      </div>
      <div class="@lg:hidden text-primary-100 w-10 shrink-0">
        {{ dayjs(activity.date).format("DD/MM") }}
      </div>

      <i
        v-if="activity.status === 'scheduled'"
        class="mdi mdi-progress-clock text-lg text-primary-100"
      />
      <i
        v-else-if="activity.status === 'incomplete'"
        class="mdi mdi-progress-helper text-lg text-orange-300"
      />
      <i v-else class="mdi mdi-check-circle-outline text-lg text-emerald-300" />

      <div
        class="mr-1 text-white font-medium text-ellipsis overflow-hidden whitespace-nowrap min-w-0"
      >
        {{ activity.name }}
      </div>

      <div class="flex-1" />

      <div class="items-center mr-2 min-w-0 hidden @lg:flex">
        <RouterLink
          v-if="activity.project !== null && !hideProject"
          :to="{
            name: 'project',
            params: { id: activity.project },
          }"
          class="border rounded-xl h-6 flex items-center px-2 mr-4 text-white text-xs tracking-wide hover:bg-primary-900 hover:border-gray-300 transition-colors min-w-0"
          @click.stop=""
        >
          <span class="mr-2">
            {{ projectsStore.getProjectById(activity.project)!.emoji }}
          </span>
          <span class="truncate">
            {{ projectsStore.getProjectById(activity.project)!.name }}
          </span>
        </RouterLink>

        <div
          v-if="activity.type"
          class="size-2 rounded-xs shrink-0"
          :class="`bg-${ACTIVITY_TYPES_COLOR[activity.type]}-300`"
        />

        <template v-if="activity.category !== null">
          <i class="mdi mdi-chevron-right text-primary-100 mx-1" />
          <RouterLink
            class="text-white text-ellipsis overflow-hidden whitespace-nowrap hover:text-primary-200"
            :to="{
              name: 'category',
              params: {
                name: categories.find((c) => c.id === activity.category)?.name.toLowerCase(),
              },
            }"
            @click.stop=""
          >
            {{ categories.find((c) => c.id === activity.category)?.name }}
          </RouterLink>
        </template>
        <template v-if="activity.subcategory !== null">
          <i class="mdi mdi-chevron-right text-primary-100 mx-1" />
          <div class="text-primary-100 text-ellipsis overflow-hidden whitespace-nowrap">
            {{ subcategories.find((c) => c.id === activity.subcategory)?.name }}
          </div>
        </template>
      </div>

      <div
        class="@lg:w-20 text-right whitespace-nowrap font-mono font-medium"
        :class="accountFilter !== null ? 'text-primary-100' : 'text-white'"
      >
        {{ getCurrencyFormatter().format(activity.amount) }}
      </div>
    </div>

    <template v-if="showTransactions">
      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="h-10 flex items-center gap-2 text-sm border-t pl-3 pr-4 @lg:pr-6 ml:pl-1"
      >
        <div class="w-4 hidden @lg:block" />
        <div class="w-7 hidden @lg:block shrink-0" />
        <div class="@lg:w-20 shrink-0" />

        <div class="flex items-center border-l-2 gap-2 h-10 flex-grow">
          <AccountLabel :account-id="transaction.fromAccount" class="ml-6" />
          <div class="mx-2 text-center text-primary-100">to</div>
          <AccountLabel :account-id="transaction.toAccount" />

          <div class="flex-1" />

          <TAmountInput
            v-model="transaction.amount"
            borderless
            class="text-xs"
            :class="accountFilter ? 'text-white' : 'text-primary-100'"
          />
        </div>
      </div>
    </template>
  </div>
</template>
