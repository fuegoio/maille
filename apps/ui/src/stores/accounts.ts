import { defineStore } from "pinia";

import type { Account } from "@maille/core/accounts";
import { AccountType } from "@maille/core/accounts";

import { useAuthStore } from "./auth";
import type { UUID } from "crypto";
import { useStorage } from "@vueuse/core";

export const ACCOUNT_TYPES_COLOR = {
  [AccountType.BANK_ACCOUNT]: "bg-indigo-200",
  [AccountType.INVESTMENT_ACCOUNT]: "bg-orange-200",
  [AccountType.CASH]: "bg-stone-200",
  [AccountType.LIABILITIES]: "bg-sky-200",
  [AccountType.EXPENSE]: "bg-red-200",
  [AccountType.REVENUE]: "bg-green-200",
};

export const ACCOUNT_TYPES_NAME = {
  [AccountType.BANK_ACCOUNT]: "Bank accounts",
  [AccountType.INVESTMENT_ACCOUNT]: "Investments",
  [AccountType.CASH]: "Cash",
  [AccountType.LIABILITIES]: "Liabilities",
  [AccountType.EXPENSE]: "Expense",
  [AccountType.REVENUE]: "Revenue",
};

export const useAccountsStore = defineStore("accounts", () => {
  const accounts = useStorage<Account[]>("accounts", []);

  const getAccountById = (accountId: UUID): Account | undefined => {
    return accounts.value.find((a) => a.id === accountId);
  };

  const addAccount = (
    name: string,
    type: AccountType,
    personal: boolean,
  ): Account => {
    const { user } = useAuthStore();
    const newAccount = {
      id: window.crypto.randomUUID(),
      name,
      type,
      user: personal ? user!.id : null,
      default: false,
      startingBalance: 0,
      startingCashBalance: 0,
      movements: false,
    };
    accounts.value.push(newAccount);
    return newAccount;
  };

  const updateAccount = (accountId: UUID) => {
    const account = getAccountById(accountId);
    if (!account) return;

    // TODO: Will create an event to update the account
    // in the API
  };

  const deleteAccount = (accountId: UUID) => {
    const account = getAccountById(accountId);
    if (!account) return;

    accounts.value.splice(accounts.value.indexOf(account), 1);
  };

  return {
    accounts,
    getAccountById,

    addAccount,
    updateAccount,
    deleteAccount,
  };
});
