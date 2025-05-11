<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";

import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Portal,
} from "@headlessui/vue";

import { usePopper } from "@/hooks/use-popper";

import {
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
  useAccountsStore,
} from "@/stores/accounts";

import { AccountType } from "@maille/core/accounts";
import UserAvatar from "../users/UserAvatar.vue";

const accountsStore = useAccountsStore();
const { accounts } = storeToRefs(accountsStore);

const props = withDefaults(
  defineProps<{
    modelValue: any | null;
    disabled?: boolean;
    movementsOnly?: boolean;
    borderless?: boolean;
    multiple?: boolean;
  }>(),
  {
    modelValue: null,
    disabled: false,
    movementsOnly: false,
    borderless: false,
    multiple: false,
  },
);
const emit = defineEmits(["update:modelValue", "close"]);

const value = ref<any | null>(props.modelValue);
if (props.modelValue === null) {
  if (props.multiple) value.value = [];
  else value.value = null;
}

watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  },
);

const [trigger, container] = usePopper({
  placement: "bottom-end",
  modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
});

defineExpose({ click: () => trigger.value.el.click() });

const accountsToDisplay = computed(() => {
  if (props.movementsOnly) return accounts.value.filter((a) => a.movements);
  return accounts.value;
});

const accountTypesToDisplay = computed(() => {
  return [
    AccountType.BANK_ACCOUNT,
    AccountType.INVESTMENT_ACCOUNT,
    AccountType.CASH,
    AccountType.LIABILITIES,
    AccountType.REVENUE,
    AccountType.EXPENSE,
  ].filter((accountType) => {
    return (
      accountsToDisplay.value.filter((a) => a.type === accountType).length > 0
    );
  });
});

watch(container, () => {
  if (container.value === null) {
    emit("close");
  }
});
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <Listbox
    v-slot="{ open }"
    v-model="value"
    :multiple="multiple"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ListboxButton
      ref="trigger"
      class="relative rounded px-3 text-left text-sm h-10 flex items-center group transition-colors"
      :class="{
        'border bg-primary-700 hover:bg-primary-600 pr-10': !borderless,
        'bg-gray-100': disabled,
        'border-primary-300/20': open && !borderless,
        'hover:border-primary-300': !open && !borderless,
      }"
      :disabled="disabled"
      v-bind="$attrs"
    >
      <template v-if="Array.isArray(value)">
        <template v-for="(accountId, index) in value" :key="accountId">
          <div v-if="index !== 0" class="ml-0.5 mr-2 text-white">,</div>
          <UserAvatar
            v-if="accounts.find((a) => a.id === accountId)!.user"
            :user-id="accounts.find((a) => a.id === accountId)!.user!"
            class="size-4 text-[0.5rem]"
          />
          <div
            class="size-4 rounded-xl mr-2 sm:mr-3 shrink-0 transition-colors -ml-1 outline outline-primary-800"
            :class="
              ACCOUNT_TYPES_COLOR[
                accounts.find((a) => a.id === accountId)!.type
              ]
            "
          />
          <div
            class="truncate font-medium text-white transition-colors"
            :class="{ 'group-hover:text-primary-300': borderless }"
          >
            {{ accounts.find((a) => a.id === accountId)!.name }}
          </div>
        </template>
      </template>
      <template v-else-if="value !== null">
        <UserAvatar
          v-if="accounts.find((a) => a.id === value)!.user"
          :user-id="accounts.find((a) => a.id === value)!.user!"
          class="size-4 text-[0.5rem] outline outline-primary-800"
        />
        <div
          class="size-4 rounded-xl mr-2 sm:mr-3 shrink-0 transition-colors -ml-1 outline outline-primary-800"
          :class="
            ACCOUNT_TYPES_COLOR[accounts.find((a) => a.id === value)!.type]
          "
        />
        <div
          class="truncate font-medium text-white transition-colors"
          :class="{ 'group-hover:text-primary-300': borderless }"
        >
          {{ accounts.find((a) => a.id === value)!.name }}
        </div>
      </template>
      <template v-else>
        <div
          class="h-3 w-3 rounded-xl mr-2 sm:mr-3 shrink-0 bg-primary-300 transition-colors"
          :class="{ 'group-hover:bg-primary-200': borderless }"
        />
        <div
          class="truncate font-medium text-primary-200 transition-colors"
          :class="{ 'group-hover:text-primary-100': borderless }"
        >
          Account
        </div>
      </template>

      <div
        v-if="!borderless"
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
      >
        <i class="mdi mdi-chevron-down" aria-hidden="true" />
      </div>
    </ListboxButton>

    <Portal v-if="open">
      <ListboxOptions
        ref="container"
        class="absolute w-56 z-50 max-h-60 overflow-auto rounded-md bg-primary-700 py-1 shadow-lg border focus:outline-none text-sm"
      >
        <template
          v-for="(accountType, typeIndex) in accountTypesToDisplay"
          :key="accountType"
        >
          <div
            class="flex items-center px-4 py-3"
            :class="typeIndex !== 0 ? 'border-t' : ''"
          >
            <div
              class="h-2 w-2 rounded-xl mr-4 shrink-0"
              :class="ACCOUNT_TYPES_COLOR[accountType]"
            />
            <div class="text-primary-100 font-medium text-xs tracking-wide">
              {{ ACCOUNT_TYPES_NAME[accountType] }}
            </div>
          </div>

          <ListboxOption
            v-for="(account, index) in accountsToDisplay.filter(
              (a) => a.type === accountType,
            )"
            v-slot="{ active, selected }"
            :key="index"
            :value="account.id"
            as="template"
          >
            <li
              :class="[
                active ? 'bg-primary-400 text-white' : 'text-white',
                'relative cursor-default select-none py-2 pl-10 pr-4 inline-flex items-center w-full',
              ]"
            >
              <span class="block truncate flex-1">
                {{ account.name }}
              </span>
              <UserAvatar
                v-if="account.user"
                :user-id="account.user"
                class="size-4 text-[0.5rem] ml-2"
              />
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-400"
              >
                <i class="mdi mdi-check" aria-hidden="true" />
              </span>
            </li>
          </ListboxOption>
        </template>
      </ListboxOptions>
    </Portal>
  </Listbox>
</template>
