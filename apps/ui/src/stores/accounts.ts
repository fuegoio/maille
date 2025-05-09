import { defineStore } from "pinia";

import type { Account } from "@maille/core/accounts";
import { AccountType } from "@maille/core/accounts";

import { useAuthStore } from "./auth";
import type { UUID } from "crypto";
import { useStorage } from "@vueuse/core";
import type { SyncEvent } from "@maille/core/sync";
import type { Mutation } from "@/mutations";

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

  const addAccount = ({
    id,
    name,
    type,
  }: {
    id?: UUID;
    name: string;
    type: AccountType;
  }): Account => {
    const { user } = useAuthStore();
    const newAccount = {
      id: id ?? window.crypto.randomUUID(),
      name,
      type,
      user: user.id,
      default: false,
      startingBalance: 0,
      startingCashBalance: 0,
      movements: false,
    };
    accounts.value.push(newAccount);
    return newAccount;
  };

  const updateAccount = (
    accountId: UUID,
    update: {
      startingBalance?: number | null;
      startingCashBalance?: number | null;
      movements?: boolean;
    },
  ) => {
    const account = getAccountById(accountId);
    if (!account) return;

    if (update.startingBalance !== undefined) {
      account.startingBalance = update.startingBalance;
    }
    if (update.startingCashBalance !== undefined) {
      account.startingCashBalance = update.startingCashBalance;
    }
    if (update.movements !== undefined) {
      account.movements = update.movements;
    }
  };

  const deleteAccount = (accountId: UUID) => {
    const account = getAccountById(accountId);
    if (!account) return;

    accounts.value.splice(accounts.value.indexOf(account), 1);
  };

  const restoreAccount = (account: Account) => {
    accounts.value.push(account);
  };

  // Events
  const handleEvent = (event: SyncEvent) => {
    if (event.type === "createAccount") {
      addAccount(event.payload);
    } else if (event.type === "updateAccount") {
      updateAccount(event.payload.id, {
        ...event.payload,
      });
    } else if (event.type === "deleteAccount") {
      deleteAccount(event.payload.id);
    }
  };

  // Mutations
  const handleMutationSuccess = (event: Mutation) => {
    if (!event.result) return;
  };

  const handleMutationError = (event: Mutation) => {
    if (event.name === "createAccount") {
      deleteAccount(event.variables.id);
    } else if (event.name === "updateAccount") {
      updateAccount(event.variables.id, {
        ...event.rollbackData,
      });
    } else if (event.name === "deleteAccount") {
      restoreAccount(event.rollbackData);
    }
  };

  return {
    accounts,
    getAccountById,

    addAccount,
    updateAccount,
    deleteAccount,

    handleEvent,
    handleMutationSuccess,
    handleMutationError,
  };
});
