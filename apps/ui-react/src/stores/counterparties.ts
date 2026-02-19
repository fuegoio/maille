import type { Counterparty } from "@/gql/graphql";
import type { SyncEvent } from "@maille/core/sync";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

interface CounterpartiesState {
  counterparties: Counterparty[];
  getCounterpartyById: (counterpartyId: string) => Counterparty | undefined;
  getCounterpartiesByAccount: (accountId: string) => Counterparty[];
  addCounterparty: (counterparty: Omit<Counterparty, "value">) => Counterparty;
  updateCounterparty: (
    counterpartyId: string,
    update: {
      name?: string;
      description?: string | null;
      user?: string | null;
    },
  ) => void;
  deleteCounterparty: (counterpartyId: string) => void;
  restoreCounterparty: (counterparty: Counterparty) => void;
  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

export const useCounterparties = create<CounterpartiesState>()(
  persist(
    (set, get) => ({
      counterparties: [],

      getCounterpartyById: (counterpartyId: string): Counterparty | undefined => {
        return get().counterparties.find((c) => c.id === counterpartyId);
      },

      getCounterpartiesByAccount: (accountId: string): Counterparty[] => {
        return get().counterparties.filter((counterparty) => counterparty.account === accountId);
      },

      addCounterparty: (counterparty) => {
        const newCounterparty = {
          ...counterparty,
          value: 0, // TODO: determine value of counterparty
        };

        set((state) => ({
          counterparties: [...state.counterparties, newCounterparty],
        }));
        return newCounterparty;
      },

      updateCounterparty: (counterpartyId, update) => {
        set((state) => ({
          counterparties: state.counterparties.map((counterparty) => {
            if (counterparty.id === counterpartyId) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              return {
                ...counterparty,
                ...filteredUpdate,
              };
            }
            return counterparty;
          }),
        }));
      },

      deleteCounterparty: (counterpartyId: string) => {
        set((state) => ({
          counterparties: state.counterparties.filter((counterparty) => counterparty.id !== counterpartyId),
        }));
      },

      restoreCounterparty: (counterparty: Counterparty) => {
        set((state) => ({
          counterparties: [...state.counterparties, counterparty],
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createCounterparty") {
          get().addCounterparty({
            ...event.payload,
          });
        } else if (event.type === "updateCounterparty") {
          get().updateCounterparty(event.payload.id, {
            ...event.payload,
          });
        } else if (event.type === "deleteCounterparty") {
          get().deleteCounterparty(event.payload.id);
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "createCounterparty") {
          get().deleteCounterparty(event.variables.id);
        } else if (event.name === "updateCounterparty") {
          get().updateCounterparty(event.variables.id, {
            ...event.rollbackData,
          });
        } else if (event.name === "deleteCounterparty") {
          get().restoreCounterparty(event.rollbackData);
        }
      },
    }),
    {
      name: "counterparties",
      storage: storage,
    },
  ),
);