import { defineStore } from "pinia";
import { StorageSerializers, useStorage } from "@vueuse/core";

import type { User } from "@maille/core/users";

export const useAuthStore = defineStore("auth", () => {
  const user = useStorage<User | null>("user", null, undefined, {
    serializer: StorageSerializers.object,
  });
  const authToken = useStorage<string | null>("access_token", null);

  const updateUser = ({
    firstName,
    lastName,
    avatar,
  }: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  }) => {
    if (!user.value) return;
    user.value = {
      ...user.value,
      firstName,
      lastName,
      avatar,
    };
  };

  const logout = async () => {
    if (!authToken.value) return;

    localStorage.clear();
    window.location.href = "/";
  };

  return {
    user,
    authToken,

    updateUser,

    logout,
  };
});
