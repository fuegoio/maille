<script setup lang="ts">
import dayjs from "dayjs";
import { storeToRefs } from "pinia";

import { useSettingsStore } from "@/stores/settings";

const settingsStore = useSettingsStore();
const { settings } = storeToRefs(settingsStore);

const CARDS = [
  {
    title: "Accounts",
    subtext: "Manage your different accounts and their settings.",
    path: "settings_accounts",
    icon: "bank",
  },
  {
    title: "Categories",
    subtext: "Manage your differents activity categories and subcategories.",
    path: "settings_categories",
    icon: "tag",
  },
];
</script>

<template>
  <div class="w-full">
    <div class="max-w-screen-lg mx-auto my-16 px-8">
      <div class="text-primary-200 font-medium text-3xl pb-3">Settings</div>
      <div class="text-primary-500 border-b pb-6 text-sm font-medium">
        Manage your global settings.
      </div>

      <div class="border-b py-10">
        <div class="text-lg font-medium text-primary-200">General</div>
        <div class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm">
          <div>
            <div class="font-medium text-primary-300">First period</div>
            <div class="text-sm text-primary-500 mt-2">
              The first period from which every balance is computed.
            </div>
          </div>

          <div class="flex-1" />
          <TPeriodPicker
            :model-value="dayjs(settings.startingPeriod)"
            class="w-full sm:w-56 mt-2 sm:mt-0"
            @update:model-value="
              settings.startingPeriod = $event.format('YYYY-MM')
            "
          />
        </div>

        <div class="mt-8 flex flex-col sm:flex-row sm:items-center text-sm">
          <div>
            <div class="font-medium text-primary-300">Currency</div>
            <div class="text-sm text-primary-500 mt-2">
              The currency of all amounts.
            </div>
          </div>

          <div class="flex-1" />
          <TSelect
            v-model="settings.currency"
            :items="
              // @ts-ignore
              Intl.supportedValuesOf('currency').map((c) => ({
                value: c,
                text: c,
              }))
            "
            class="w-full sm:w-56 mt-2 sm:mt-0"
          />
        </div>
      </div>

      <div class="py-10">
        <div class="text-lg font-medium text-primary-200">Explore features</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 mt-6 gap-4">
          <RouterLink
            v-for="(card, index) in CARDS"
            :key="index"
            :to="{ name: card.path }"
            class="rounded border bg-primary-700 p-4 flex items-center hover:bg-primary-800 transition-colors"
          >
            <div class="flex items-start">
              <i
                class="mdi text-primary-400 mr-3 -mt-1"
                :class="`mdi-${card.icon}`"
              />

              <div>
                <div class="text-sm font-medium text-primary-100">
                  {{ card.title }}
                </div>
                <div class="text-sm text-primary-500 mt-1.5 h-8">
                  {{ card.subtext }}
                </div>
              </div>
            </div>
            <div class="flex-1" />
            <i class="mdi mdi-chevron-right mdi-24px text-primary-300 ml-4" />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
