<script setup lang="ts">
import { computed, ref, useAttrs, watch } from "vue";

import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Portal,
} from "@headlessui/vue";

import { usePopper } from "@/hooks/use-popper";
import { twMerge } from "tailwind-merge";

const props = withDefaults(
  defineProps<{
    modelValue: any | null;
    items: Record<string, any>[];
    itemValue?: string;
    itemText?: string;
    itemIcon?: string;
    disabled?: boolean;
    multiple?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: null,
    itemValue: "value",
    itemText: "text",
    itemIcon: "icon",
    disabled: false,
    multiple: false,
    placeholder: undefined,
  },
);
const emit = defineEmits(["update:modelValue", "close"]);

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const value = ref<any | null>(props.modelValue);
if (props.modelValue === null) {
  if (props.multiple) value.value = [];
  else value.value = null;
}

watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  },
);

const [trigger, container] = usePopper({
  placement: "bottom-start",
  modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
});

defineExpose({ click: () => trigger.value.el.click() });

const selectedItem = computed(() => {
  if (value.value === null) return null;
  if (props.multiple) {
    return value.value.map(
      (v: any) => props.items.find((i) => getValue(i) === v)!,
    );
  } else {
    return props.items.find((i) => getValue(i) === value.value)!;
  }
});

const selectedItemText = computed<string>(() => {
  if (selectedItem.value === null) return null;
  if (props.multiple) {
    return selectedItem.value.map((i: any) => getText(i)).join(", ");
  } else {
    return getText(selectedItem.value);
  }
});

const getText = (item: Record<string, any> | null) => {
  if (!item) return;
  return item[props.itemText];
};

const getValue = (item: Record<string, any> | null) => {
  if (!item) return;
  return item[props.itemValue];
};

const getIcon = (item: Record<string, any> | null) => {
  if (!item) return;
  return item[props.itemIcon];
};

watch(container, () => {
  if (container.value === null) {
    emit("close");
  }
});
</script>

<template>
  <Listbox
    v-slot="{ open }"
    v-model="value"
    :multiple="multiple"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ListboxButton ref="trigger" as="template">
      <slot :open="open" :text="selectedItemText">
        <button
          :class="
            twMerge(
              'relative rounded pl-3 pr-10 text-left text-sm h-10 border transition-colors',
              disabled ? 'opacity-30' : '',
              open ? 'border-primary-300' : '',
              !open && !disabled
                ? 'hover:border-primary-300 hover:bg-primary-600 focus:border-primary-300'
                : '',
              attrs.class as string,
            )
          "
          v-bind="{ ...attrs, class: undefined }"
        >
          <slot
            v-if="selectedItem !== null"
            name="selected"
            :item="selectedItem"
          >
            <span class="block truncate text-white">
              {{ selectedItemText }}
            </span>
          </slot>
          <span
            v-else-if="placeholder"
            class="block truncate text-primary-100/50"
          >
            {{ placeholder }}
          </span>

          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-white"
          >
            <i class="mdi mdi-chevron-down" aria-hidden="true" />
          </span>
        </button>
      </slot>
    </ListboxButton>

    <Portal v-if="open">
      <ListboxOptions
        ref="container"
        class="absolute w-56 z-50 max-h-60 overflow-auto rounded-md bg-primary-700 py-1 shadow-lg border focus:outline-none text-sm"
      >
        <ListboxOption
          v-for="(item, index) in items"
          v-slot="{ active, selected }"
          :key="index"
          :value="getValue(item)"
          as="template"
        >
          <li
            :class="[
              active ? 'bg-primary-600 text-white' : 'text-primary-100',
              'flex items-center py-2 px-4',
            ]"
          >
            <slot
              name="item"
              :item="item"
              :active="active"
              :selected="selected"
            >
              <div class="truncate">
                {{ getText(item) }}
              </div>
            </slot>

            <div class="flex-1" />

            <i
              v-if="selected"
              class="mdi mdi-check text-primary-400"
              aria-hidden="true"
            />
          </li>
        </ListboxOption>

        <div v-if="items.length === 0" class="px-4 py-2 text-primary-400">
          No option available
        </div>
      </ListboxOptions>
    </Portal>
  </Listbox>
</template>
