<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { parse } from "csv-parse/browser/esm/sync";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";

import UploadDropZone from "@/components/UploadDropZone.vue";
import AccountSelect from "@/components/accounts/AccountSelect.vue";

import { useMovementsStore } from "@/stores/movements";
import type { UUID } from "crypto";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const props = withDefaults(
  defineProps<{
    large?: boolean;
  }>(),
  { large: false },
);
const emit = defineEmits(["imported"]);

const movementStore = useMovementsStore();
const { movements } = storeToRefs(movementStore);

const importMovementsDialog = ref({
  show: false,
  step: 0,
  records: undefined as Record<string, string>[] | undefined,
  mapping: {
    date: undefined as string | undefined,
    amount: undefined as string | undefined,
    name: undefined as string | undefined,
  },
  account: undefined as UUID | undefined,
});

const resetImportMovementsDialog = () => {
  importMovementsDialog.value = {
    show: false,
    step: 0,

    records: undefined,
    mapping: {
      date: undefined,
      amount: undefined,
      name: undefined,
    },
    account: undefined,
  };
};

const headers = computed(() => {
  if (!importMovementsDialog.value.records) return;
  else if (importMovementsDialog.value.records.length === 0) return;

  return Object.keys(importMovementsDialog.value.records[0]);
});

const handleInputFile = (file: File) => {
  const reader = new FileReader();
  reader.addEventListener("load", (event) => {
    const data = event.target!.result as string;
    importMovementsDialog.value.records = parse(data, {
      delimiter: [";", ","],
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    if (importMovementsDialog.value.records?.length !== 0) {
      importMovementsDialog.value.step = 1;
    }
  });
  reader.readAsText(file);
};

const processFile = () => {
  if (importMovementsDialog.value.records === undefined) return;
  else if (importMovementsDialog.value.account === undefined) return;
  else if (importMovementsDialog.value.mapping.name === undefined) return;
  else if (importMovementsDialog.value.mapping.date === undefined) return;
  else if (importMovementsDialog.value.mapping.amount === undefined) return;

  importMovementsDialog.value.records.forEach((record) => {
    const movementName = record[importMovementsDialog.value.mapping.name!];
    const movementDate = dayjs(
      record[importMovementsDialog.value.mapping.date!],
      ["DD/MM/YYYY", "D/M/YYYY"],
    );
    const movementAmount = parseFloat(
      record[importMovementsDialog.value.mapping.amount!]
        .replace(/ /g, "")
        .replace(/,/g, "."),
    );

    const existingMovement = movements.value.find(
      (m) =>
        m.account === importMovementsDialog.value.account &&
        m.date.isSame(movementDate) &&
        m.amount === movementAmount &&
        m.name.toLowerCase() === movementName.toLowerCase(),
    );

    if (!existingMovement) {
      movementStore.addNewMovement(
        movementDate,
        movementAmount,
        importMovementsDialog.value.account!,
        movementName,
      );
    }
  });

  emit("imported");
  resetImportMovementsDialog();
};

const open = () => {
  importMovementsDialog.value.show = true;
};
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <button
    v-bind="$attrs"
    type="button"
    class="inline-flex items-center justify-center transition rounded bg-primary-400 text-white hover:bg-primary-300"
    :class="[large ? 'px-3.5 h-8' : 'w-7 sm:w-auto sm:px-2.5 h-7']"
    @click="open"
  >
    <i class="mdi mdi-upload text-base mt-0.5" />
    <span
      class="ml-2 font-medium"
      :class="large ? 'text-sm' : 'text-xs hidden sm:block'"
    >
      Import
      <span class="hidden sm:inline">movements</span>
    </span>
  </button>

  <TransitionRoot appear :show="importMovementsDialog.show" as="template">
    <Dialog as="div" class="relative z-50" @close="resetImportMovementsDialog">
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
              class="w-full max-w-xl transform overflow-hidden rounded-lg bg-primary-700 text-left align-middle shadow-2xl transition-all border"
            >
              <DialogTitle as="div" class="flex border-b pb-4 pt-5 px-8">
                <div class="text-white font-medium">
                  Import movements from a CSV
                </div>
                <div class="flex-1" />
                <button
                  class="inline-flex items-center justify-center w-6 h-6 transition text-primary-500 hover:text-primary-100 min-w-6 shrink-0"
                  @click="resetImportMovementsDialog"
                >
                  <i class="mdi mdi-close text-lg" />
                </button>
              </DialogTitle>

              <div v-if="importMovementsDialog.step === 0" class="px-6 py-4">
                <UploadDropZone @file="handleInputFile" />
              </div>
              <div v-else class="w-full">
                <div
                  class="py-4 px-8 flex flex-col sm:flex-row sm:items-center text-sm border-b"
                >
                  <div class="text-sm text-primary-100">Account</div>
                  <div class="flex-1" />
                  <AccountSelect
                    v-model="importMovementsDialog.account"
                    movements-only
                    class="w-full sm:w-56 mt-2 sm:mt-0"
                  />
                </div>

                <div class="py-2 border-b">
                  <div
                    class="py-2 px-8 flex flex-col sm:flex-row sm:items-center text-sm"
                  >
                    <div class="text-sm text-primary-100">Name field</div>
                    <div class="flex-1" />
                    <TSelect
                      v-model="importMovementsDialog.mapping.name"
                      :items="headers!.map((h) => ({ value: h, text: h }))"
                      class="w-full sm:w-56 mt-2 sm:mt-0"
                    />
                  </div>
                  <div
                    class="py-2 px-8 flex flex-col sm:flex-row sm:items-center text-sm"
                  >
                    <div class="text-sm text-primary-100">Amount field</div>
                    <div class="flex-1" />
                    <TSelect
                      v-model="importMovementsDialog.mapping.amount"
                      :items="headers!.map((h) => ({ value: h, text: h }))"
                      class="w-full sm:w-56 mt-2 sm:mt-0"
                    />
                  </div>
                  <div
                    class="py-2 px-8 flex flex-col sm:flex-row sm:items-center text-sm"
                  >
                    <div class="text-sm text-primary-100">Date field</div>
                    <div class="flex-1" />
                    <TSelect
                      v-model="importMovementsDialog.mapping.date"
                      :items="headers!.map((h) => ({ value: h, text: h }))"
                      class="w-full sm:w-56 mt-2 sm:mt-0"
                    />
                  </div>
                </div>

                <div class="text-sm text-primary-100 px-8 mt-4 mb-2">
                  CSV data
                </div>
                <div class="w-full overflow-auto max-h-44 py-4 px-8">
                  <table class="border-collapse">
                    <thead>
                      <tr>
                        <th
                          v-for="header in headers"
                          :key="header"
                          class="border border-white h-10 px-6 text-white text-sm"
                        >
                          {{ header }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(
                          record, index
                        ) in importMovementsDialog.records!"
                        :key="index"
                      >
                        <td
                          v-for="header in headers"
                          :key="header"
                          class="border border-white h-10 px-6 text-primary-100 text-sm whitespace-nowrap"
                        >
                          {{ record[header] }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="border-t px-8 py-4 flex justify-end">
                  <TBtn outlined @click="resetImportMovementsDialog">
                    Cancel
                  </TBtn>
                  <div class="flex-1" />
                  <TBtn @click="processFile"> Import movements </TBtn>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
