<script setup lang="ts">
import _ from "lodash";
import { computed, ref, watch } from "vue";
import { RecycleScroller } from "vue-virtual-scroller";

import emojis from "emojibase-data/en/data.json";
import emojisMessages from "emojibase-data/en/messages.json";

import { Menu, MenuButton, MenuItems, MenuItem, Portal } from "@headlessui/vue";

import { usePopper } from "@/hooks/use-popper";

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    placeholder?: string | null;
  }>(),
  { modelValue: null, placeholder: null },
);
const emit = defineEmits(["update:modelValue"]);

const value = ref<string | null>(props.modelValue);
const search = ref<string>("");

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

type EmojiLines = { index: number; emojis?: string[]; text?: string }[];

const emojiLinesToDisplay = computed<EmojiLines>(() => {
  let indexLine = 0;
  return emojisMessages.groups.reduce(
    (acc: EmojiLines, group, index: number) => {
      const emojisFiltered = _.sortBy(
        emojis.filter(
          (e) => e.label.includes(search.value) && e.group === index,
        ),
        ["order"],
      ).map((e) => e.emoji);

      const lines = [];
      const lineSize = container.value
        ? container.value.el.clientWidth / (9 * 4)
        : 10;

      while (emojisFiltered.length > 0)
        lines.push(emojisFiltered.splice(0, lineSize));

      if (lines.length > 0) {
        indexLine += 1;
        return acc.concat(
          [{ index: indexLine, text: group.message }],
          lines.map((l) => {
            indexLine += 1;
            return { index: indexLine, emojis: l };
          }),
        );
      } else {
        return acc;
      }
    },
    [],
  );
});

const selectEmoji = (emoji: string) => {
  value.value = emoji;
  emit("update:modelValue", value.value);
};

watch(container, () => {
  if (container.value === null) {
    search.value = "";
  }
});
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <Menu v-slot="{ open }">
    <MenuButton ref="trigger" as="template">
      <slot :open="open" :value="value">
        <button
          class="flex items-center justify-center rounded h-8 w-8"
          :class="{
            'bg-primary-900': open,
            'hover:bg-primary-600': !open,
          }"
          v-bind="$attrs"
          @click.stop=""
        >
          <template v-if="value">
            {{ value }}
          </template>
          <template v-else-if="placeholder">
            <i class="mdi text-primary-700" :class="placeholder" />
          </template>
        </button>
      </slot>
    </MenuButton>

    <Portal v-if="open">
      <MenuItems
        ref="container"
        class="rounded-md bg-primary-700 shadow-lg ring-1 ring-black ring-opacity-10 focus:outline-none z-20 h-[340px] w-[410px] flex flex-col max-w-full"
      >
        <div class="flex items-center px-4 py-3 border-b">
          <TTextField
            v-model="search"
            dense
            icon="mdi-magnify"
            placeholder="Search"
            autofocus
            class="w-full"
          />
        </div>

        <RecycleScroller
          v-slot="{ item }"
          class="px-4 pt-2 pb-4 flex-1"
          :items="emojiLinesToDisplay"
          :item-size="32"
          key-field="index"
        >
          <div v-if="item.emojis" class="flex items-center gap-1">
            <MenuItem
              v-for="(emoji, index) in item.emojis"
              :key="index"
              as="div"
              class="h-8 w-8 text-sm hover:bg-primary-100 hover:text-primary-600 flex items-center justify-center rounded"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </MenuItem>
          </div>
          <div
            v-else
            class="flex items-center text-primary-700 text-sm font-medium capitalize h-6 my-1 px-1"
          >
            {{ item.text }}
          </div>
        </RecycleScroller>
      </MenuItems>
    </Portal>
  </Menu>
</template>
