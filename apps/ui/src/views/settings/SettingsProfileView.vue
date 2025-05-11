<script setup lang="ts">
import { updateUserMutation } from "@/mutations/users";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import { useUsersStore } from "@/stores/users";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const userStore = useUsersStore();
const eventsStore = useEventsStore();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

if (!user.value) {
  throw new Error("User not found");
}

const updateProfileForm = ref({
  firstName: user.value.firstName,
  lastName: user.value.lastName,
  avatar: user.value.avatar,
});

const updateUser = async () => {
  if (!user.value) return;

  const { firstName, lastName, avatar } = updateProfileForm.value;

  userStore.updateUser(user.value.id, {
    firstName,
    lastName,
    avatar,
  });

  authStore.updateUser({
    firstName,
    lastName,
    avatar,
  });

  eventsStore.sendEvent({
    name: "updateUser",
    mutation: updateUserMutation,
    variables: {
      firstName,
      lastName,
      avatar,
    },
    rollbackData: {
      firstName: user.value.firstName,
      lastName: user.value.lastName,
      avatar: user.value.avatar,
    },
  });
};
</script>

<template>
  <div class="w-full">
    <div class="max-w-screen-md mx-auto my-16 px-8">
      <div class="text-primary-200 font-medium text-3xl pb-3">Profile</div>
      <div class="text-primary-500 border-b pb-6 text-sm font-medium">
        Manage your profile information.
      </div>

      <div v-if="user" class="p-4 border rounded mt-6 flex flex-col gap-4">
        <div class="flex gap-4 items-center justify-between">
          <div>
            <div class="text-primary-100 font-medium text-sm">Email</div>
          </div>
          <TTextField
            :model-value="user.email"
            disabled
            placeholder="Email"
            class="w-64"
            name="email"
          />
        </div>
        <div class="h-[1px] bg-primary-500/20" />
        <div class="flex gap-4 items-center justify-between">
          <div>
            <div class="text-primary-100 font-medium text-sm">First name</div>
          </div>
          <TTextField
            v-model="updateProfileForm.firstName"
            placeholder="First name"
            class="w-64"
            name="firstName"
          />
        </div>
        <div class="h-[1px] bg-primary-500/20" />
        <div class="flex gap-4 items-center justify-between">
          <div>
            <div class="text-primary-100 font-medium text-sm">Last name</div>
          </div>
          <TTextField
            v-model="updateProfileForm.lastName"
            placeholder="Last name"
            class="w-64"
            name="lastName"
          />
        </div>
        <div class="h-[1px] bg-primary-500/20" />
        <div class="flex justify-end">
          <TBtn large @click="updateUser"> Update </TBtn>
        </div>
      </div>
    </div>
  </div>
</template>
