<script setup lang="ts">
import dayjs from "dayjs";
import { computed, ref, watch } from "vue";

import { Menu, MenuButton, MenuItems, MenuItem, Portal } from "@headlessui/vue";

import { usePopper } from "@/hooks/use-popper";

defineOptions({ inheritAttrs: false });

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const props = withDefaults(
  defineProps<{
    modelValue: dayjs.Dayjs | null;
    disabled?: boolean;
    borderless?: boolean;
  }>(),
  { modelValue: null, disabled: false, borderless: false },
);
const emit = defineEmits(["update:modelValue"]);

const value = ref<dayjs.Dayjs | null>(props.modelValue);
const date = ref(dayjs(value.value ?? undefined).date(1));

watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  },
);

const [trigger, container] = usePopper({
  placement: "bottom-start",
  modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
});

const daysToDisplay = computed(() => {
  const firstDayOfMonth = date.value.day();
  const numberOfRows = Math.ceil(
    (date.value.daysInMonth() + firstDayOfMonth) / 7,
  );

  let days = [...Array(numberOfRows * 7).keys()];
  days = days.map((d) => d - firstDayOfMonth);

  return days;
});

const selectDate = (day: number) => {
  value.value = date.value.add(day, "day").startOf("day");
  emit("update:modelValue", value.value);
};

const isCurrentDate = (day: number) => {
  return (
    date.value.add(day, "day").format("DD/MM/YYYY") ===
    dayjs().format("DD/MM/YYYY")
  );
};

const isValueDate = (day: number) => {
  if (!value.value) return false;
  return (
    date.value.add(day, "day").format("DD/MM/YYYY") ===
    dayjs(value.value).format("DD/MM/YYYY")
  );
};
</script>

<template>
  <Menu v-slot="{ open }">
    <MenuButton ref="trigger" :disabled="disabled" as="template">
      <slot :open="open" :value="value" :disabled="disabled">
        <button
          class="flex items-center rounded h-10 text-left transition-colors"
          :class="{
            'border-primary-300': open && !borderless,
            'hover:border-primary-300': !open && !borderless,
            'border bg-primary-700 hover:bg-primary-600': !borderless,
            'hover:text-white': borderless,
            'px-3': !borderless,
          }"
          v-bind="$attrs"
        >
          <span v-if="value">
            {{ dayjs(value).format("DD/MM/YYYY") }}
          </span>
          <span v-else class="text-primary-300"> 12/04/2022 </span>
        </button>
      </slot>
    </MenuButton>

    <Portal v-if="open">
      <MenuItems
        ref="container"
        class="w-64 rounded-md bg-primary-700 shadow-lg ring-1 ring-primary-600 ring-opacity-10 focus:outline-none z-20"
      >
        <div class="flex items-center px-4 py-3">
          <div class="text-sm font-medium text-white">
            {{ date.format("MMMM YYYY") }}
          </div>
          <div class="flex-1" />
          <i
            class="mdi mdi-chevron-left text-primary-400 hover:text-primary-100 mdi-18px transition-colors"
            @click="date = date.subtract(1, 'month')"
          />
          <i
            class="mdi mdi-chevron-right text-primary-400 hover:text-primary-100 mdi-18px transition-colors"
            @click="date = date.add(1, 'month')"
          />
        </div>

        <div class="text-sm px-4 grid gap-2 grid-cols-7 border-b">
          <div
            v-for="day in WEEK_DAYS"
            :key="day"
            class="text-primary-300 py-2 text-center"
          >
            {{ day }}
          </div>
        </div>

        <div class="px-4 grid gap-2 grid-cols-7 pt-2 pb-4">
          <MenuItem
            v-for="day in daysToDisplay"
            :key="day"
            as="div"
            class="h-6 text-sm hover:bg-primary-300 hover:text-primary-600 flex items-center justify-center rounded"
            :class="{
              'text-primary-700 bg-primary-400': isCurrentDate(day),
              'text-white bg-primary-400': isValueDate(day),
              'text-primary-400': day < 0 || day >= date.daysInMonth(),
              'text-primary-100':
                day >= 0 && day < date.daysInMonth() && !isCurrentDate(day),
            }"
            @click="selectDate(day)"
          >
            {{ date.add(day, "day").format("DD") }}
          </MenuItem>
        </div>
      </MenuItems>
    </Portal>
  </Menu>
</template>
