<script setup lang="ts">
import { computed } from "vue";

import { stringify } from "csv-stringify/browser/esm/sync";

import { useViewsStore } from "@/stores/views";

import {
  verifyLiabilityFilter,
  type Liability,
} from "@maille/core/liabilities";

const props = defineProps<{
  viewId: string;
  liabilities: Liability[];
}>();

const liabilityView = computed(() =>
  useViewsStore().getLiabilityView(props.viewId),
);

const filteredLiabilities = computed(() => {
  return props.liabilities.filter((liability) => {
    if (liabilityView.value.filters.length === 0) return true;

    return liabilityView.value.filters
      .map((filter) => {
        return verifyLiabilityFilter(filter, liability);
      })
      .every((f) => f);
  });
});

const exportLiabilities = () => {
  const csvFile = stringify([
    ["id", "date", "name", "amount", "account"],
    ...filteredLiabilities.value.map((l) => [
      l.linkId,
      l.date.format("YYYY-MM-DD"),
      l.name,
      l.amount,
      l.account,
    ]),
  ]);

  const url = window.URL.createObjectURL(new Blob([csvFile]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `liabilities_export.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
</script>

<template>
  <TTooltip text="Export liabilities">
    <button
      type="button"
      class="inline-flex items-center justify-center transition text-primary-100 hover:text-white hover:border-primary-300 rounded h-7 w-7 border border-dashed"
      @click="exportLiabilities"
    >
      <i class="mdi mdi-download mt-0.5" />
    </button>
  </TTooltip>
</template>
