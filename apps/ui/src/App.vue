<script setup lang="ts">
import { ref } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import NavigationDrawer from "@/containers/NavigationDrawer.vue";
import { Toaster } from "vue-sonner";

import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "./stores/events";
import { storeToRefs } from "pinia";

const FULLSCREEN_ROUTES = ["login", "not-found", "loading"];

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const loading = ref(true);

const loadAuth = async () => {
  await router.isReady();

  if (!user.value) {
    if (!["login", "signup"].includes(route.name as string)) {
      await router.replace({ name: "login" });
    }
  } else {
    if (route.name === "login") {
      await router.replace({ name: "dashboard" });
    }

    if (route.name !== "loading") {
      const eventsStore = useEventsStore();
      eventsStore.subscribe();
      eventsStore.reconcileEvents();
    }
  }

  loading.value = false;
};

loadAuth();
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-75 absolute"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="!loading"
      class="flex h-full w-full text-primary-100 bg-primary-950"
    >
      <NavigationDrawer
        v-if="!FULLSCREEN_ROUTES.includes(route.name as string)"
      />

      <main class="flex-1 p-2 @container">
        <div
          class="flex w-full h-full min-w-0 overflow-y-auto gap-4 overflow-x-hidden relative"
        >
          <RouterView v-slot="{ Component }">
            <component :is="Component" />
          </RouterView>
        </div>
      </main>

      <Toaster
        theme="dark"
        :toast-options="{
          style: { background: 'var(--color-primary-950)' },
        }"
        :offset="{
          right: '28px',
          bottom: '12px',
        }"
      />
    </div>
    <div
      v-else
      class="flex h-full w-full items-center justify-center text-primary-200 bg-gradient-to-tl from-primary-950 to-primary-800"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="45"
        height="45"
        viewBox="0 0 45 45"
        stroke="currentColor"
      >
        <g
          fill="none"
          fill-rule="evenodd"
          transform="translate(1 1)"
          stroke-width="2"
        >
          <circle cx="22" cy="22" r="6" stroke-opacity="0">
            <animate
              attributeName="r"
              begin="1.5s"
              dur="3s"
              values="6;22"
              calcMode="linear"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              begin="1.5s"
              dur="3s"
              values="1;0"
              calcMode="linear"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              begin="1.5s"
              dur="3s"
              values="2;0"
              calcMode="linear"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="22" cy="22" r="6" stroke-opacity="0">
            <animate
              attributeName="r"
              begin="3s"
              dur="3s"
              values="6;22"
              calcMode="linear"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              begin="3s"
              dur="3s"
              values="1;0"
              calcMode="linear"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              begin="3s"
              dur="3s"
              values="2;0"
              calcMode="linear"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="22" cy="22" r="8">
            <animate
              attributeName="r"
              begin="0s"
              dur="1.5s"
              values="6;1;2;3;4;5;6"
              calcMode="linear"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
    </div>
  </Transition>
</template>
