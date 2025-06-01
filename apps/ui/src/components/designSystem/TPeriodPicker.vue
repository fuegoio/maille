<script setup lang="ts">
import dayjs from "dayjs";
import { ref, watch } from "vue";

import { Menu, MenuButton, MenuItems, MenuItem, Portal } from "@headlessui/vue";

import { usePopper } from "@/hooks/use-popper";

defineOptions({ inheritAttrs: false });

const MONTHS = [
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "May",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Oct.",
  "Nov.",
  "Dec.",
];

const props = withDefaults(
  defineProps<{
    modelValue: dayjs.Dayjs | null;
    disabled?: boolean;
  }>(),
  { modelValue: null, disabled: false },
);
const emit = defineEmits(["update:modelValue"]);

const value = ref<dayjs.Dayjs | null>(props.modelValue);
const year = ref(dayjs(value.value ?? undefined).year());

watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  },
);

const [trigger, container] = usePopper({
  placement: "bottom-end",
  modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
});

const selectPeriod = (month: number) => {
  value.value = dayjs().date(1).year(year.value).month(month).startOf("day");
  emit("update:modelValue", value.value);
};

const isCurrentPeriod = (month: number) => {
  return month === dayjs().month() && year.value === dayjs().year();
};

const isValuePeriod = (month: number) => {
  if (!value.value) return false;
  return month === value.value.month() && year.value === value.value.year();
};
</script>

<template>
  <Menu v-slot="{ open }">
    <MenuButton
      ref="trigger"
      class="flex items-center rounded bg-primary-700 h-10 border hover:bg-primary-600 transition-colors"
      :class="{
        'border-primary-300': open,
        'hover:border-primary-300': !open,
      }"
      v-bind="$attrs"
    >
      <input
        name="period-input"
        :value="value ? dayjs(value).format('MMMM YYYY') : undefined"
        placeholder="12/04/2022"
        class="pr-3 text-right min-w-0 border-none h-8 bg-transparent w-full"
      />
    </MenuButton>

    <Portal v-if="open">
      <MenuItems
        ref="container"
        class="w-64 rounded-md bg-primary-700 shadow-lg ring-1 ring-primary-600 ring-opacity-10 focus:outline-none"
      >
        <div class="flex items-center px-4 py-3 border-b">
          <div class="text-sm font-medium text-primary-300 pl-2">
            {{ year }}
          </div>
          <div class="flex-1" />
          <i
            class="mdi mdi-chevron-left text-primary-600 hover:text-primary-300 mdi-18px"
            @click="year -= 1"
          />
          <i
            class="mdi mdi-chevron-right text-primary-600 hover:text-primary-300 mdi-18px"
            @click="year += 1"
          />
        </div>

        <div class="px-4 grid gap-2 grid-cols-3 pt-2 pb-4">
          <MenuItem
            v-for="(monthName, month) in MONTHS"
            :key="month"
            as="div"
            class="h-10 text-sm hover:bg-primary-100 hover:text-primary-600 flex items-center justify-center rounded"
            :class="{
              'text-primary-200 bg-gray-200': isCurrentPeriod(month),
              'text-primary-600 bg-primary-100': isValuePeriod(month),
              'text-primary-300': !isCurrentPeriod(month),
            }"
            @click="selectPeriod(month)"
          >
            {{ monthName }}
          </MenuItem>
        </div>
      </MenuItems>
    </Portal>
  </Menu>
</template>
