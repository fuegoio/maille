<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem, Portal } from "@headlessui/vue";

import { usePopper } from "@/hooks/use-popper";

type MenuItemType = {
  value: string | number;
  text: string | number;
  icon?: string;
};

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    items: MenuItemType[];
    disabled?: boolean;
    icon?: string;
    primary?: boolean;
  }>(),
  { primary: false, disabled: false, icon: "mdi-dots-horizontal" },
);
const emit = defineEmits(["click:item"]);

const [trigger, container] = usePopper({
  placement: "bottom-end",
  modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
});
</script>

<template>
  <Menu v-slot="{ open }">
    <MenuButton
      ref="trigger"
      class="inline-flex items-center justify-center w-6 h-6 transition hover:text-white min-w-6 shrink-0"
      v-bind="$attrs"
      :class="{
        'text-primary-400': open,
        'border rounded hover:bg-primary-600 text-primary-100': primary,
        'text-primary-200': !primary,
      }"
      @click.stop=""
    >
      <i :class="`mdi ${props.icon}`" />
    </MenuButton>

    <Portal v-if="open">
      <MenuItems
        ref="container"
        class="w-56 divide-y divide-gray-100 rounded-md bg-primary-700 shadow-lg ring-1 ring-primary-600 ring-opacity-10 focus:outline-none"
      >
        <div class="px-1 py-1">
          <MenuItem
            v-for="item in props.items"
            v-slot="{ active }"
            :key="item.value"
          >
            <button
              :class="[
                active ? 'bg-primary-400 text-white' : 'text-primary-100',
                'flex w-full items-center rounded-md px-2 py-1',
              ]"
              @click="emit('click:item', item.value)"
            >
              <i
                v-if="item.icon"
                class="mdi mr-3 mt-0.5"
                :class="`mdi-${item.icon}`"
              />
              <span class="text-sm">
                {{ item.text }}
              </span>
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Portal>
  </Menu>
</template>
