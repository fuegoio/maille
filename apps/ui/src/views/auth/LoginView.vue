<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

import Logo from "@/components/Logo.vue";

import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import config from "@/config";

const authStore = useAuthStore();
const { authToken, user } = storeToRefs(authStore);

const eventsStore = useEventsStore();
const { clientId } = storeToRefs(eventsStore);

const router = useRouter();

const email = ref();
const password = ref();
const loginError = ref(false);

const login = async () => {
  if (!email.value) return;
  else if (!password.value) return;

  try {
    const generatedClientId = window.crypto.randomUUID();
    const request = await fetch(`${config.apiUrl}/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        clientId: generatedClientId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    localStorage.clear();
    const data = await request.json();

    authToken.value = data.jwt;
    user.value = data.user;
    clientId.value = generatedClientId;
    router.push("/loading");
  } catch (e) {
    loginError.value = true;
  }
};
</script>

<template>
  <div class="h-full w-full flex items-center justify-center">
    <div class="flex flex-col items-center w-full">
      <Logo class="h-20 w-20" />
      <div class="font-medium mt-8 text-white text-lg">Login to Maille</div>
      <div class="mt-8 px-4 w-full sm:max-w-[400px]">
        <TTextField
          v-model="email"
          placeholder="Email"
          name="email"
          autofocus
          @update:model-value="loginError = false"
        />
        <TTextField
          v-model="password"
          placeholder="Password"
          type="password"
          class="mt-4"
          name="password"
          @update:model-value="loginError = false"
          @keydown.enter="login"
        />
        <div
          v-if="loginError"
          class="text-white my-2 font-semibold text-sm bg-red-400 rounded px-4 py-3"
        >
          Email or password are incorrect.
        </div>

        <TBtn class="w-full mt-6" large :disabled="loginError" @click="login">
          Log in
        </TBtn>
      </div>
    </div>
  </div>
</template>
