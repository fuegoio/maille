<script setup lang="ts">
import _ from "lodash";
import { ref } from "vue";

import { Portal } from "@headlessui/vue";

import { usePopper } from "@/hooks/use-popper";

const props = withDefaults(
  defineProps<{
    text: string;
    placement?: string;
  }>(),
  { placement: "auto" },
);

const [trigger, container] = usePopper({
  placement: props.placement,
  modifiers: [{ name: "offset", options: { offset: [0, 12] } }],
});

const popoverHover = ref(false);

const hoverPopover = _.debounce((): void => {
  popoverHover.value = true;
}, 400);

const closePopover = (): void => {
  popoverHover.value = false;
  hoverPopover.cancel();
};
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <span
    v-bind="$attrs"
    ref="trigger"
    @mouseover="hoverPopover"
    @mouseleave="closePopover"
  >
    <slot />
  </span>

  <Portal v-if="popoverHover">
    <Transition
      appear
      enter-active-class="transition-opacity duration-100 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        ref="container"
        class="px-4 py-1.5 text-xs rounded bg-primary-700 shadow-lg ring-1 ring-black ring-opacity-10 focus:outline-none z-20 text-white"
      >
        {{ text }}
      </div>
    </Transition>
  </Portal>
</template>
