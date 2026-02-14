import { AccountType, type Account } from "@maille/core/accounts";
import type { SyncEvent } from "@maille/core/sync";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

export const ACCOUNT_TYPES_COLOR = {
  [AccountType.BANK_ACCOUNT]: "bg-indigo-400",
  [AccountType.INVESTMENT_ACCOUNT]: "bg-orange-400",
  [AccountType.CASH]: "bg-stone-200",
  [AccountType.LIABILITIES]: "bg-sky-400",
  [AccountType.EXPENSE]: "bg-red-300",
  [AccountType.REVENUE]: "bg-green-300",
};

export const ACCOUNT_TYPES_NAME = {
  [AccountType.BANK_ACCOUNT]: "Bank accounts",
  [AccountType.INVESTMENT_ACCOUNT]: "Investments",
  [AccountType.CASH]: "Cash",
  [AccountType.LIABILITIES]: "Liabilities",
  [AccountType.EXPENSE]: "Expense",
  [AccountType.REVENUE]: "Revenue",
};

interface AccountsState {
  accounts: Account[];
  getAccountById: (accountId: string) => Account | undefined;
  addAccount: (account: Account) => Account;
  updateAccount: (
    accountId: string,
    update: {
      startingBalance?: number | null;
      startingCashBalance?: number | null;
      movements?: boolean;
    },
  ) => void;
  deleteAccount: (accountId: string) => void;
  restoreAccount: (account: Account) => void;
  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

export const useAccounts = create<AccountsState>()(
  persist(
    (set, get) => ({
      accounts: [],

      getAccountById: (accountId: string): Account | undefined => {
        return get().accounts.find((a) => a.id === accountId);
      },

      addAccount: (account) => {
        set((state) => ({
          accounts: [...state.accounts, account],
        }));

        return account;
      },

      updateAccount: (
        accountId: string,
        update: {
          startingBalance?: number | null;
          startingCashBalance?: number | null;
          movements?: boolean;
        },
      ) => {
        set((state) => ({
          accounts: state.accounts.map((account) => {
            if (account.id === accountId) {
              return {
                ...account,
                startingBalance:
                  update.startingBalance !== undefined
                    ? update.startingBalance
                    : account.startingBalance,
                startingCashBalance:
                  update.startingCashBalance !== undefined
                    ? update.startingCashBalance
                    : account.startingCashBalance,
                movements:
                  update.movements !== undefined
                    ? update.movements
                    : account.movements,
              };
            }
            return account;
          }),
        }));
      },

      deleteAccount: (accountId: string) => {
        set((state) => ({
          accounts: state.accounts.filter(
            (account) => account.id !== accountId,
          ),
        }));
      },

      restoreAccount: (account: Account) => {
        set((state) => ({
          accounts: [...state.accounts, account],
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createAccount") {
          get().addAccount({
            ...event.payload,
            default: false,
            movements: false,
            startingBalance: 0,
            startingCashBalance: 0,
            user: event.user,
          });
        } else if (event.type === "updateAccount") {
          get().updateAccount(event.payload.id, {
            ...event.payload,
          });
        } else if (event.type === "deleteAccount") {
          get().deleteAccount(event.payload.id);
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "createAccount") {
          get().deleteAccount(event.variables.id);
        } else if (event.name === "updateAccount") {
          get().updateAccount(event.variables.id, {
            ...event.rollbackData,
          });
        } else if (event.name === "deleteAccount") {
          get().restoreAccount(event.rollbackData);
        }
      },
    }),
    {
      name: "accounts",
      storage: storage,
    },
  ),
);
