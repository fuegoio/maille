<script setup lang="ts">
import { ref, watch } from "vue";

import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    description: string;
    disabled?: boolean;
  }>(),
  { modelValue: false, disabled: false },
);
const emit = defineEmits(["cancel", "confirm"]);

const showDialog = ref(props.modelValue);

watch(
  () => props.modelValue,
  () => (showDialog.value = props.modelValue),
);

const cancel = () => {
  emit("cancel");
  showDialog.value = false;
};

const confirm = () => {
  emit("confirm");
  showDialog.value = false;
};
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <slot :open="() => (showDialog = true)" />

  <TransitionRoot appear :show="showDialog" as="template">
    <Dialog as="div" class="relative z-50" @close="cancel">
      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-100 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-lg transform overflow-hidden rounded-lg bg-primary-800 text-left align-middle shadow-2xl transition-all border"
            >
              <DialogTitle as="div" class="flex border-b pb-4 pt-5 px-8">
                <div class="text-white font-medium">
                  <template v-if="!disabled"> Confirm deletion? </template>
                  <template v-else> Impossible to delete </template>
                </div>
                <div class="flex-1" />
                <button
                  class="inline-flex items-center justify-center w-6 h-6 transition text-primary-500 hover:text-primary-100 min-w-6 shrink-0"
                  @click="cancel"
                >
                  <i class="mdi mdi-close text-lg" />
                </button>
              </DialogTitle>

              <div class="px-8 py-6 text-sm text-primary-100 leading-snug">
                {{ description }}
              </div>

              <div class="border-t px-8 py-4 flex justify-end">
                <template v-if="!disabled">
                  <TBtn outlined class="mr-2" @click="cancel"> Cancel </TBtn>
                  <TBtn danger @click="confirm"> Delete </TBtn>
                </template>
                <TBtn v-else @click="cancel"> Understood </TBtn>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
