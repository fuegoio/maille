<script setup lang="ts">
import { AccountType } from "@maille/core/accounts";

import AccountTypeSection from "@/containers/settings/accounts/AccountTypeSection.vue";
</script>

<template>
  <div class="w-full">
    <div class="max-w-screen-md mx-auto my-16 px-8">
      <div class="text-primary-200 font-medium text-3xl pb-3">Accounts</div>
      <div class="text-primary-500 border-b pb-6 text-sm font-medium">
        Manage your different bank and virtual accounts.
      </div>

      <div class="text-sm text-primary-500 mt-5 leading-normal mb-10">
        Accounts define from and to your money can come and go. They can
        represent bank accounts, investment supports, liabilities pockets, or
        anything that you want to analyse as an account.
      </div>

      <AccountTypeSection
        v-for="accountType in [
          AccountType.BANK_ACCOUNT,
          AccountType.INVESTMENT_ACCOUNT,
          AccountType.CASH,
          AccountType.LIABILITIES,
          AccountType.EXPENSE,
          AccountType.REVENUE,
        ]"
        :key="accountType"
        :account-type="accountType"
      />
    </div>
  </div>
</template>
