<script setup lang="ts">
import dayjs from "dayjs";
import _ from "lodash";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Portal,
} from "@headlessui/vue";

import PeriodLabel from "@/components/periods/PeriodLabel.vue";

import { usePopper } from "@/hooks/use-popper";

import type { Period } from "@/types/periods";
import { usePeriodsStore } from "@/stores/periods";

const router = useRouter();
const route = useRoute();

const periodsStore = usePeriodsStore();
const { periodsAvailable } = storeToRefs(periodsStore);

const [trigger, container] = usePopper({
  placement: "bottom-start",
  modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
});

const period = computed(() => route.params.period as string);

const periodDate = computed(() => {
  let periodDate: dayjs.Dayjs;
  if (period.value === "current") periodDate = dayjs();
  else if (period.value === "past") periodDate = dayjs().subtract(1, "month");
  else periodDate = dayjs(period.value);

  return periodDate;
});

const periodDateString = computed(() => periodDate.value.format("YYYY-MM"));
const periodDateLabel = computed(() =>
  periodsStore.getPeriodLabel({
    month: periodDate.value.month(),
    year: periodDate.value.year(),
  }),
);

const periodsList = computed<(Period & { label: string; date: dayjs.Dayjs })[]>(
  () => {
    return _.orderBy(
      periodsAvailable.value,
      ["year", "month"],
      ["desc", "desc"],
    )
      .filter((p, i, arr) => {
        if (
          periodsStore.getPeriodLabel(p) === "Current" ||
          periodsStore.getPeriodLabel(p) === "Completed"
        )
          return true;

        if (arr[i + 1]) {
          return periodsStore.getPeriodLabel(arr[i + 1]) === "Current";
        } else {
          return true;
        }
      })
      .map((p) => {
        return {
          ...p,
          label: periodsStore.getPeriodLabel(p),
          date: dayjs().month(p.month).year(p.year),
        };
      });
  },
);

const handleInput = (newDate: string) => {
  router.push({ name: route.name!, params: { period: newDate } });
};
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <Listbox
    v-slot="{ open }"
    :model-value="periodDateString"
    @update:model-value="handleInput"
  >
    <ListboxButton
      ref="trigger"
      class="relative rounded px-3 text-left h-8 hover:bg-primary-700 flex items-center mx-2"
      :class="{
        'border-primary-300': open,
        'hover:border-primary-300': !open,
      }"
      v-bind="$attrs"
    >
      <i
        class="mdi text-white text-xl mr-3"
        :class="{
          'mdi-calendar-clock': periodDateLabel === 'Current',
          'mdi-calendar-check': periodDateLabel === 'Completed',
          'mdi-calendar-arrow-right': periodDateLabel === 'Future',
        }"
      />
      <span class="text-white text-sm truncate font-semibold">
        {{ periodDate.format("MMMM YYYY") }}
      </span>
    </ListboxButton>

    <Portal v-if="open">
      <ListboxOptions
        ref="container"
        class="absolute w-80 z-50 max-h-60 overflow-auto rounded-md bg-primary-700 py-1 shadow-lg border focus:outline-none text-sm"
      >
        <ListboxOption
          v-for="(period, index) in periodsList"
          v-slot="{ active }"
          :key="index"
          :value="period.date.format('YYYY-MM')"
          as="template"
        >
          <li
            :class="[
              active &&
              (period.date.month() !== periodDate.month() ||
                period.date.year() !== periodDate.year())
                ? 'bg-primary-600'
                : 'text-gray-900',
              'relative select-none py-2 px-4 flex items-center',
              period.date.month() === periodDate.month() &&
              period.date.year() === periodDate.year()
                ? 'bg-primary-400 text-white'
                : 'text-primary-100',
            ]"
          >
            <i
              class="mdi text-primary-100 text-xl mr-3 mt-1"
              :class="{
                'mdi-calendar-clock': period.label === 'Current',
                'mdi-calendar-check': period.label === 'Completed',
                'mdi-calendar-arrow-right': period.label === 'Future',
              }"
            />

            <span
              :class="[
                period.date.month() === periodDate.month() &&
                period.date.year() === periodDate.year()
                  ? 'font-medium'
                  : 'font-normal',
                'block truncate',
              ]"
            >
              {{ period.date.format("MMMM YYYY") }}
            </span>
            <div class="flex-1" />

            <PeriodLabel :period="period" />
          </li>
        </ListboxOption>
      </ListboxOptions>
    </Portal>
  </Listbox>
</template>
