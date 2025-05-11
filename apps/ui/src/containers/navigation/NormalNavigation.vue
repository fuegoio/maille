<script setup lang="ts">
import dayjs from "dayjs";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useRoute } from "vue-router";

import { Menu, MenuButton, MenuItems, MenuItem, Portal } from "@headlessui/vue";

import { useAuthStore } from "@/stores/auth";
import { useActivitiesStore } from "@/stores/activities";
import { useMovementsStore } from "@/stores/movements";
import { usePeriodsStore } from "@/stores/periods";

import { usePopper } from "@/hooks/use-popper";

import Logo from "@/components/Logo.vue";
import { useEventsStore } from "@/stores/events";
import UserAvatar from "@/components/users/UserAvatar.vue";
import { twMerge } from "tailwind-merge";

const props = defineProps<{
  openMobile: boolean;
}>();
const emit = defineEmits(["close", "routeClick"]);

const route = useRoute();

const { user, logout } = useAuthStore();

const activitiesStore = useActivitiesStore();
const movementsStore = useMovementsStore();
const periodsStore = usePeriodsStore();
const eventsStore = useEventsStore();

const { activities } = storeToRefs(activitiesStore);
const { movements } = storeToRefs(movementsStore);
const { periodsAvailable } = storeToRefs(periodsStore);
const { isOnline, eventsQueueLength } = storeToRefs(eventsStore);

const [trigger, container] = usePopper({
  placement: "bottom-end",
  modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
});

const activitiesReconcilateNumber = computed(() => {
  return activities.value.reduce((acc, activity) => {
    if (activity.status === "incomplete") return acc + 1;
    return acc;
  }, 0);
});

const movementsToLinkNumber = computed(() => {
  return movements.value.reduce((acc, movement) => {
    if (movement.status === "incomplete") return acc + 1;
    return acc;
  }, 0);
});

const pastPeriodAvailable = computed(() => {
  const pastMonth = dayjs().subtract(1, "month");
  return periodsAvailable.value.find(
    (p) => p.month === pastMonth.month() && p.year === pastMonth.year(),
  );
});

const menuItems = computed(() => {
  return [
    {
      name: "Dashboard",
      to: { name: "dashboard" },
      icon: "mdi mdi-view-dashboard",
      class: "",
    },
    {
      name: "Periods",
      to: { name: "periods" },
      icon: "mdi mdi-calendar-blank",
      class: "",
      subItems: [
        {
          name: "Current",
          to: { name: "period", params: { period: "current" } },
          badge: undefined,
          hidden: false,
        },
        {
          name: "Past",
          to: { name: "period", params: { period: "past" } },
          badge: undefined,
          hidden: pastPeriodAvailable.value,
        },
      ],
    },
    {
      name: "Projects",
      to: { name: "projects" },
      icon: "mdi mdi-book-multiple",
      class: "",
    },
    {
      name: "Activities",
      to: { name: "activities", params: { id: "" } },
      icon: "mdi mdi-book",
      class: "mt-8",
      subItems: [
        {
          name: "To reconciliate",
          to: { name: "activities", params: { id: "reconciliation" } },
          badge: activitiesReconcilateNumber.value,
          hidden: false,
        },
      ],
    },
    {
      name: "Movements",
      to: { name: "movements", params: { id: "" } },
      icon: "mdi mdi-cash-fast",
      class: "",
      subItems: [
        {
          name: "To link",
          to: { name: "movements", params: { id: "tolink" } },
          badge: movementsToLinkNumber.value,
          hidden: false,
        },
      ],
    },
    {
      name: "Liabilities",
      to: { name: "liabilities" },
      icon: "mdi mdi-account-cash",
      class: "",
    },
  ];
});
</script>

<template>
  <div class="flex items-center mt-12 lg:mt-5 justify-between px-1">
    <div class="flex items-center">
      <RouterLink to="/" class="flex items-center">
        <Logo class="h-8 w-8" />
      </RouterLink>

      <div
        v-if="!isOnline"
        class="rounded-full text-xs text-primary-300 py-1 px-2.5 font-medium"
      >
        <i class="mdi mdi-lightning-bolt text-primary-600" />
        Offline
      </div>
      <div
        v-else-if="eventsQueueLength"
        class="flex items-center gap-1 rounded-full text-xs text-primary-300 py-1 px-2.5 font-medium whitespace-nowrap"
      >
        <i class="mdi mdi-refresh block animate-spin text-primary-600" />
        Syncing {{ eventsQueueLength }}
      </div>
    </div>

    <Menu v-if="user" v-slot="{ open }">
      <MenuButton ref="trigger">
        <UserAvatar
          :user-id="user.id"
          :class="twMerge(open && 'bg-primary-300', 'hover:bg-primary-300')"
        />
      </MenuButton>

      <Portal v-if="open">
        <MenuItems
          ref="container"
          class="w-56 divide-y divide-gray-100 rounded-md bg-primary-700 shadow-lg ring-1 ring-black ring-opacity-10 focus:outline-none z-20"
        >
          <div class="px-1 py-1">
            <MenuItem v-slot="{ active }" @click="logout">
              <button
                class="text-sm"
                :class="[
                  active ? 'text-white' : 'text-primary-100',
                  'flex w-full items-center rounded-md px-2 py-1.5',
                ]"
              >
                Log out
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </Portal>
    </Menu>
  </div>

  <div class="mt-4">
    <template v-for="item in menuItems" :key="item.name">
      <RouterLink
        class="flex items-center hover:text-white hover:bg-primary-800 rounded px-2 h-8 group transition-colors my-1"
        :to="item.to"
        :class="
          route.name === item.to.name &&
          JSON.stringify(route.params) === JSON.stringify(item.to.params ?? {})
            ? 'text-white bg-primary-800 ' + item.class
            : 'text-primary-100 ' + item.class
        "
        @click="emit('routeClick')"
      >
        <i :class="item.icon" />
        <span class="text-sm ml-2 font-medium">{{ item.name }}</span>
      </RouterLink>

      <div
        v-if="item.subItems"
        class="ml-4 border-l border-l-primary-300/20 pl-2"
      >
        <template v-for="subItem in item.subItems" :key="subItem.name">
          <RouterLink
            v-if="!subItem.hidden"
            class="flex items-center hover:text-white hover:bg-primary-800 rounded px-2 h-8 group transition-colors my-1 text-sm font-medium"
            :to="subItem.to"
            :class="
              route.name === subItem.to.name &&
              JSON.stringify(route.params) === JSON.stringify(subItem.to.params)
                ? 'text-white bg-primary-800'
                : 'text-primary-100'
            "
            @click="emit('routeClick')"
          >
            {{ subItem.name }}

            <div v-if="subItem.badge" class="flex-1" />
            <div
              v-if="subItem.badge"
              class="rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-800 font-normal"
            >
              {{ subItem.badge }}
            </div>
          </RouterLink>
        </template>
      </div>
    </template>
  </div>

  <div class="flex-grow" />

  <div class="border-t pt-2 pb-3">
    <a
      href="/docs"
      target="_blank"
      class="flex items-center px-2 h-6 text-primary-100 hover:text-primary-300 transition-colors my-3"
    >
      <i class="mdi mdi-book-open-page-variant text-sm" />
      <span class="text-xs ml-2"> Documentation </span>
    </a>
    <RouterLink
      class="flex items-center px-2 h-6 transition-colors my-3 text-primary-100 hover:text-primary-300"
      :to="{ name: 'settings' }"
      @click="emit('routeClick')"
    >
      <i class="mdi mdi-cog text-sm" />
      <span class="text-xs ml-2"> Settings </span>
    </RouterLink>
  </div>
</template>
