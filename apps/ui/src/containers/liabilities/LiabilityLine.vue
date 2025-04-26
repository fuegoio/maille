<script lang="ts" setup>
import dayjs from "dayjs";
import AccountLabel from "@/components/AccountLabel.vue";
import { getCurrencyFormatter } from "@/utils/currency";
import type { Liability } from "@maille/core/liabilities";
import { useRouter } from "vue-router";
import { useActivitiesStore } from "@/stores/activities";
import { computed } from "vue";

const router = useRouter();

const activitiesStore = useActivitiesStore();

const props = defineProps<{
  liability: Liability;
}>();

const activityLinked = computed(() => {
  if (!props.liability.activity) return null;
  return activitiesStore.getActivityById(props.liability.activity);
});

const goToActivity = () => {
  if (!activityLinked.value) return;
  router.push({
    name: "activities",
    params: { id: activityLinked.value.number },
  });
};
</script>

<template>
  <div
    class="h-10 flex items-center gap-2 pr-2 sm:pr-6 border-b text-sm flex-shrink-0 transition-colors hover:bg-primary-800/20 pl-4 sm:pl-2"
    @click="goToActivity"
  >
    <div class="hidden sm:block text-primary-100 w-20 shrink-0 ml-4">
      {{ dayjs(liability.date).format("DD/MM/YYYY") }}
    </div>
    <div class="sm:hidden text-primary-100 w-10 shrink-0">
      {{ dayjs(liability.date).format("DD/MM") }}
    </div>

    <AccountLabel :account-id="liability.account" />

    <div
      class="ml-1 text-primary-100 text-ellipsis overflow-hidden whitespace-nowrap"
    >
      {{ liability.name }}
    </div>

    <div class="flex-1" />
    <div class="text-white text-right whitespace-nowrap font-mono">
      {{ getCurrencyFormatter().format(liability.amount) }}
    </div>
  </div>
</template>
