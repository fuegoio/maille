import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

import type { User } from "@maille/core/users";
import type { SyncEvent } from "@maille/core/sync";
import type { Mutation } from "@/mutations";
import { useAuthStore } from "./auth";
import { useAccountsStore } from "./accounts";
import { isAccountType } from "@maille/core/accounts";

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

  const deleteUser = (id: string) => {
    users.value = users.value.filter((u) => u.id !== id);
  };

  const getUserById = (id: string) => {
    return users.value.find((u) => u.id === id);
  };

  // Events
  const handleEvent = (event: SyncEvent) => {
    if (event.type === "createUser") {
      addUser({ ...event.payload, avatar: null });

      const accountsStore = useAccountsStore();
      event.payload.accounts.forEach((account) => {
        if (!isAccountType(account.type)) return;
        accountsStore.addAccount({
          ...account,
          type: account.type,
        });
      });
    } else if (event.type === "updateUser") {
      updateUser(event.payload.id, {
        ...event.payload,
      });
    }
  };

  // Mutations
  const handleMutationSuccess = (event: Mutation) => {
    if (!event.result) return;
    if (event.name === "createUser") {
      addUser(event.result.createUser);

      const accountsStore = useAccountsStore();
      event.result.createUser.accounts.forEach((account) => {
        if (!isAccountType(account.type)) return;
        accountsStore.addAccount({
          ...account,
          type: account.type,
        });
      });
    }
  };

  const handleMutationError = (event: Mutation) => {
    const authStore = useAuthStore();
    const user = authStore.user;

    if (event.name === "updateUser") {
      if (!user) return;
      updateUser(user.id, {
        ...event.rollbackData,
      });
    } else if (event.name === "createUser") {
      if (!user) return;
      deleteUser(user.id);
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
