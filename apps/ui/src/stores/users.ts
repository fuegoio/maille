import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

import type { User } from "@maille/core/users";
import type { SyncEvent } from "@maille/core/sync";
import type { Mutation } from "@/mutations";
import { useAuthStore } from "./auth";

export const useUsersStore = defineStore("users", () => {
  const users = useStorage<User[]>("users", []);

  const addUser = (user: User) => {
    users.value.push(user);
  };

  const updateUser = (id: string, user: Partial<User>) => {
    const index = users.value.findIndex((u) => u.id === id);
    if (index === -1) return;
    users.value[index] = { ...users.value[index], ...user };
  };

  const getUserById = (id: string) => {
    return users.value.find((u) => u.id === id);
  };

  // Events
  const handleEvent = (event: SyncEvent) => {
    if (event.type === "createUser") {
      addUser(event.payload);
    } else if (event.type === "updateUser") {
      updateUser(event.payload.id, {
        ...event.payload,
      });
    }
  };

  // Mutations
  const handleMutationSuccess = (event: Mutation) => {
    if (!event.result) return;
  };

  const handleMutationError = (event: Mutation) => {
    const authStore = useAuthStore();
    const user = authStore.user;

    if (event.name === "updateUser") {
      if (!user) return;
      updateUser(user.id, {
        ...event.rollbackData,
      });
    }
  };

  return {
    users,
    getUserById,

    updateUser,

    handleEvent,
    handleMutationSuccess,
    handleMutationError,
  };
});
