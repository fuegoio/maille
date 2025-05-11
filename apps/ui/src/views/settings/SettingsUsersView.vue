<script setup lang="ts">
import UserAvatar from "@/components/users/UserAvatar.vue";
import { createUserMutation } from "@/mutations/users";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import { useUsersStore } from "@/stores/users";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const userStore = useUsersStore();
const { users } = storeToRefs(userStore);

const eventsStore = useEventsStore();

const authStore = useAuthStore();
const { user: currentUser } = storeToRefs(authStore);

const createUserDialog = ref({
  show: false,
  firstName: "",
  lastName: "",
  email: "",
  password: "",
});

const createUser = async () => {
  const { email, firstName, lastName, password } = createUserDialog.value;

  eventsStore.sendEvent({
    name: "createUser",
    mutation: createUserMutation,
    variables: {
      firstName,
      lastName,
      email,
      password,
    },
    rollbackData: undefined,
  });

  resetUserDialog();
};

const resetUserDialog = () => {
  createUserDialog.value = {
    show: false,
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  };
};
</script>

<template>
  <div class="w-full">
    <div class="max-w-screen-md mx-auto my-16 px-8">
      <div class="flex items-center justify-between border-b pb-6">
        <div>
          <div class="text-primary-200 font-medium text-3xl pb-3">Users</div>
          <div class="text-primary-500 text-sm font-medium">
            Manage the users using this instance.
          </div>
        </div>
        <TBtn @click="createUserDialog.show = true"> Add user </TBtn>
      </div>

      <div class="p-4 border rounded mt-6 flex flex-col gap-4">
        <template v-for="user in users" :key="user.id">
          <div class="flex items-center justify-between gap-4 w-full">
            <UserAvatar :user-id="user.id" class="rounded size-8 text-xs" />
            <div class="flex flex-col gap-1">
              <div class="text-primary-200 font-medium text-sm">
                {{ user.firstName }} {{ user.lastName }}
              </div>
              <div class="text-primary-500 text-xs">{{ user.email }}</div>
            </div>
            <div class="flex-1" />
            <div class="text-primary-300 text-xs flex-1 text-right">
              {{ user.id === currentUser?.id ? "You" : "" }}
            </div>
          </div>
          <div
            v-if="user.id !== users[users.length - 1]?.id"
            class="h-[1px] bg-primary-500/20"
          />
        </template>
      </div>

      <TransitionRoot appear :show="createUserDialog.show" as="template">
        <Dialog as="div" class="relative z-50" @close="resetUserDialog">
          <div class="fixed inset-0 overflow-y-auto">
            <div
              class="flex min-h-full items-center justify-center p-4 text-center"
            >
              <TransitionChild
                as="template"
                enter="duration-100 ease-out"
                enter-from="opacity-0 scale-95"
                enter-to="opacity-100 scale-100"
                leave="duration-100 ease-in"
                leave-from="opacity-100 scale-100"
                leave-to="opacity-0 scale-95"
              >
                <DialogPanel
                  class="w-full max-w-xl transform overflow-hidden rounded-lg bg-primary-800 text-left align-middle shadow-2xl transition-all border"
                >
                  <DialogTitle as="div" class="flex border-b pb-4 pt-5 px-8">
                    <div class="text-white font-medium">Add a new user</div>
                    <div class="flex-1" />
                    <button
                      class="inline-flex items-center justify-center w-6 h-6 transition text-primary-500 hover:text-primary-100 min-w-6 shrink-0"
                      @click="resetUserDialog"
                    >
                      <i class="mdi mdi-close text-lg" />
                    </button>
                  </DialogTitle>

                  <div class="px-8 py-6">
                    <div
                      class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                    >
                      <div class="text-sm text-primary-100">Email</div>
                      <div class="flex-1" />
                      <TTextField
                        v-model="createUserDialog.email"
                        placeholder="Email"
                        class="w-full sm:w-56 mt-2 sm:mt-0"
                      />
                    </div>
                    <div
                      class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                    >
                      <div class="text-sm text-primary-100">First name</div>
                      <div class="flex-1" />
                      <TTextField
                        v-model="createUserDialog.firstName"
                        placeholder="First name"
                        class="w-full sm:w-56 mt-2 sm:mt-0"
                      />
                    </div>
                    <div
                      class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                    >
                      <div class="text-sm text-primary-100">Last name</div>
                      <div class="flex-1" />
                      <TTextField
                        v-model="createUserDialog.lastName"
                        placeholder="Last name"
                        class="w-full sm:w-56 mt-2 sm:mt-0"
                      />
                    </div>
                    <div
                      class="mt-4 flex flex-col sm:flex-row sm:items-center text-sm"
                    >
                      <div class="text-sm text-primary-100">Password</div>
                      <div class="flex-1" />
                      <TTextField
                        v-model="createUserDialog.password"
                        placeholder="Password"
                        class="w-full sm:w-56 mt-2 sm:mt-0"
                      />
                    </div>
                  </div>

                  <div class="border-t px-8 py-4 flex justify-end">
                    <TBtn @click="createUser"> Create user </TBtn>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </TransitionRoot>
    </div>
  </div>
</template>
