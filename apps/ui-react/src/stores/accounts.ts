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
  [AccountType.ASSETS]: "bg-violet-400",
};

export const ACCOUNT_TYPES_NAME = {
  [AccountType.BANK_ACCOUNT]: "Bank accounts",
  [AccountType.INVESTMENT_ACCOUNT]: "Investments",
  [AccountType.CASH]: "Cash",
  [AccountType.LIABILITIES]: "Liabilities",
  [AccountType.EXPENSE]: "Expense",
  [AccountType.REVENUE]: "Revenue",
  [AccountType.ASSETS]: "Assets",
};

interface AccountsState {
  accounts: Account[];
  getAccountById: (accountId: string) => Account | undefined;
  addAccount: (account: Account) => Account;
  updateAccount: (accountId: string, update: Partial<Account>) => void;
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

      updateAccount: (accountId, update) => {
        set((state) => ({
          accounts: state.accounts.map((account) => {
            if (account.id === accountId) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              return {
                ...account,
                ...filteredUpdate,
              };
            }
            return account;
          }),
        }));
      },

      deleteAccount: (accountId) => {
        set((state) => ({
          accounts: state.accounts.filter(
            (account) => account.id !== accountId,
          ),
        }));
      },

      restoreAccount: (account) => {
        set((state) => ({
          accounts: [...state.accounts, account],
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createAccount") {
          get().addAccount({
            ...event.payload,
            default: false,
            sharing: event.payload.sharing || [],
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
