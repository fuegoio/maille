<script setup lang="ts">
import { useUsersStore } from "@/stores/users";
import { computed } from "vue";
import { twMerge } from "tailwind-merge";
import type { UUID } from "crypto";

const props = defineProps<{
  userId: UUID;
  class?: string;
}>();

const usersStore = useUsersStore();
const user = computed(() => {
  return usersStore.getUserById(props.userId);
});

const userInitials = computed(() => {
  if (!user.value) return;
  if (!user.value.lastName) return user.value.firstName[0];
  return `${user.value.firstName[0]}${user.value.lastName[0]}`;
});
</script>

<template>
  <div
    :class="
      twMerge(
        'inline-flex items-center justify-center w-6 h-6 transition-colors  shrink-0 rounded-full text-[0.6rem] font-semibold text-primary-100 bg-primary-800 border border-white/40',
        props.class,
      )
    "
  >
    {{ `${userInitials}` }}
  </div>
</template>
