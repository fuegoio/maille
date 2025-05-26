<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import { evaluate } from "mathjs";
import { Popover, PopoverButton, PopoverPanel, Portal } from "@headlessui/vue";

import { usePopper } from "@/hooks/use-popper";
import { getCurrencyFormatter } from "@/utils/currency";


defineOptions({ inheritAttrs: false });

const CALCULATOR_KEYS = [
  "C",
  "plus-minus",
  "percentage",
  "divide",
  7,
  8,
  9,
  "multiply",
  4,
  5,
  6,
  "minus",
  1,
  2,
  3,
  "plus",
  "back",
  0,
  "point",
  "validate",
];

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    disabled?: boolean;
    clearable?: boolean;
    placeholder?: string;
    borderless?: boolean;
  }>(),
  {
    modelValue: null,
    disabled: false,
    clearable: false,
    placeholder: "18,99 €",
    borderless: false,
  },
);
const emit = defineEmits(["update:modelValue", "close"]);
defineExpose({
  click: () => trigger.value.$el.click(),
});

const [trigger, container] = usePopper({
  placement: "bottom-start",
  modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
});

const value = ref<number | null>(props.modelValue);
const calculatorInput = ref<string>("");
const calculatorElement = ref<HTMLElement | null>(null);

watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  },
);

watch(
  () => calculatorElement.value,
  () => {
    const isOpen = calculatorElement.value !== null;
    calculatorInput.value = "";

    if (isOpen && value.value !== null) {
      calculatorInput.value = value.value.toString();
    }
  },
);

watch(container, () => {
  if (container.value === null) {
    emit("close");
  }
});

const computedCalculatorValue = computed(() => {
  try {
    const result = evaluate(
      calculatorInput.value.replace("×", "*").replace("÷", "/"),
    );
    return Math.round(result * 100) / 100;
  } catch (e) {
    return NaN;
  }
});

const isValueValid = computed(() => {
  return (
    !isNaN(computedCalculatorValue.value) ||
    (calculatorInput.value === "" && props.clearable)
  );
});

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const handleKeyPress = (event: KeyboardEvent, closeFunction: Function) => {
  if (!isNaN(parseInt(event.key))) {
    handleCalculatorKey(parseInt(event.key), closeFunction);
  }

  switch (event.key) {
    case "Enter":
      event.preventDefault();
      event.stopPropagation();
      handleCalculatorKey("validate", closeFunction);
      break;
    case "Backspace":
      handleCalculatorKey("back", closeFunction);
      break;
    case "*":
      handleCalculatorKey("multiply", closeFunction);
      break;
    case "/":
      handleCalculatorKey("divide", closeFunction);
      break;
    case "+":
      handleCalculatorKey("plus", closeFunction);
      break;
    case "-":
      handleCalculatorKey("minus", closeFunction);
      break;
    case "%":
      handleCalculatorKey("percentage", closeFunction);
      break;
    case ".":
      handleCalculatorKey("point", closeFunction);
      break;
  }

  nextTick(() => {});
};

const handleCalculatorKey = (key: number | string, closeFunction: Function) => {
  if (typeof key === "number") {
    if (calculatorInput.value === "0") calculatorInput.value = "";
    calculatorInput.value = calculatorInput.value.concat(key.toString());
    return;
  }

  switch (key) {
    case "point":
      calculatorInput.value += ".";
      break;

    case "plus":
      calculatorInput.value += "+";
      break;
    case "minus":
      calculatorInput.value += "-";
      break;
    case "multiply":
      calculatorInput.value += "×";
      break;
    case "divide":
      calculatorInput.value += "÷";
      break;
    case "percentage":
      calculatorInput.value += "%";
      break;
    case "plus-minus":
      if (calculatorInput.value.startsWith("-")) {
        calculatorInput.value = calculatorInput.value.substring(1);
      } else {
        calculatorInput.value = "-" + calculatorInput.value;
      }
      break;

    case "C":
      calculatorInput.value = "";
      break;
    case "back":
      if (calculatorInput.value.length > 0)
        calculatorInput.value = calculatorInput.value.slice(0, -1);
      break;

    case "validate":
      if (calculatorInput.value.length == 0 && props.clearable) {
        value.value = null;
        emit("update:modelValue", value.value);
        closeFunction();
      } else if (isValueValid.value) {
        value.value = computedCalculatorValue.value;
        emit("update:modelValue", value.value);
        closeFunction();
      }
      break;
  }
};
</script>

<template>
  <Popover v-slot="{ open, close }">
    <PopoverButton
      ref="trigger"
      class="h-10 flex items-center rounded whitespace-nowrap font-mono text-white"
      v-bind="$attrs"
      :class="{
        'border-primary-300': open && !borderless,
        'hover:border-primary-300': !open && !borderless,
        'border bg-primary-700 hover:bg-primary-600 px-3': !borderless,
        'hover:text-white': borderless,
      }"
      @keydown="($event) => (open ? handleKeyPress($event, close) : undefined)"
    >
      <template v-if="value !== null">
        {{ getCurrencyFormatter().format(value) }}
      </template>
      <span v-else class="text-primary-300">
        {{ placeholder }}
      </span>
    </PopoverButton>

    <Portal v-if="open">
      <PopoverPanel
        ref="container"
        class="w-56 rounded-md bg-primary-700 shadow-lg ring-1 ring-black ring-opacity-10 focus:outline-none z-20"
        @keydown="handleKeyPress($event, close)"
      >
        <div
          ref="calculatorElement"
          class="flex items-center h-10 text-sm px-4 font-mono"
        >
          <div class="text-white font-medium">
            {{ calculatorInput }}
          </div>
          <div class="flex-1" />
          <div
            v-if="
              !isNaN(computedCalculatorValue) &&
              parseFloat(calculatorInput) !== computedCalculatorValue
            "
            class="text-primary-100"
          >
            {{ numberFormatter.format(computedCalculatorValue) }}
          </div>
        </div>

        <div class="px-2 py-4 grid gap-y-2 grid-cols-4 border-t">
          <div
            v-for="touch in CALCULATOR_KEYS"
            :key="touch"
            class="flex justify-center"
          >
            <div
              class="text-white h-10 w-10 flex items-center justify-center rounded transition"
              :class="
                touch === 'validate'
                  ? isValueValid
                    ? 'bg-primary-600 hover:bg-primary-500'
                    : 'bg-primary-800'
                  : 'bg-primary-600 hover:bg-primary-500 shadow'
              "
              @click="handleCalculatorKey(touch, close)"
            >
              <span
                v-if="typeof touch === 'number'"
                class="text-sm font-medium"
              >
                {{ touch }}
              </span>
              <span v-else-if="touch === 'point'">.</span>

              <i
                v-else-if="touch === 'divide'"
                class="mdi mdi-division text-primary-100"
              />
              <i
                v-else-if="touch === 'multiply'"
                class="mdi mdi-close text-primary-100"
              />
              <i
                v-else-if="touch === 'minus'"
                class="mdi mdi-minus text-primary-100"
              />
              <i
                v-else-if="touch === 'plus'"
                class="mdi mdi-plus text-primary-100"
              />
              <i
                v-else-if="touch === 'back'"
                class="mdi mdi-backspace-outline"
              />

              <i
                v-else-if="touch === 'plus-minus'"
                class="mdi mdi-plus-minus-variant text-teal-500"
              />
              <i
                v-else-if="touch === 'percentage'"
                class="mdi mdi-percent text-teal-500"
              />
              <span
                v-else-if="touch === 'C'"
                class="text-sm text-teal-500 font-medium"
              >
                C
              </span>

              <i
                v-else-if="touch === 'validate'"
                class="mdi mdi-check"
                :class="isValueValid ? 'text-white' : 'text-primary-600'"
              />
            </div>
          </div>
        </div>
      </PopoverPanel>
    </Portal>
  </Popover>
</template>
