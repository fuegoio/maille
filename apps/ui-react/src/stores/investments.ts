import type { Investment, InvestmentPrice } from "@maille/core/accounts";
import type { SyncEvent } from "@maille/core/sync";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { migrationFlags, storage } from "./storage";

interface InvestmentsState {
  investments: Investment[];
  investmentPrices: InvestmentPrice[];
  getInvestmentById: (investmentId: string) => Investment | undefined;
  getInvestmentsByAccount: (accountId: string) => Investment[];
  getPricesByInvestment: (investmentId: string) => InvestmentPrice[];
  getPriceById: (priceId: string) => InvestmentPrice | undefined;
  addInvestment: (investment: Investment) => void;
  updateInvestment: (
    investmentId: string,
    update: {
      account?: string;
      name?: string;
      symbol?: string | null;
      description?: string | null;
      quantity?: number;
    },
  ) => void;
  deleteInvestment: (investmentId: string) => void;
  restoreInvestment: (
    investment: Investment,
    prices: InvestmentPrice[],
  ) => void;
  addInvestmentPrice: (price: InvestmentPrice) => void;
  updateInvestmentPrice: (
    priceId: string,
    update: { date?: Date; price?: number },
  ) => void;
  deleteInvestmentPrice: (priceId: string) => void;
  restoreInvestmentPrice: (price: InvestmentPrice) => void;
  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

const sameDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export const useInvestments = create<InvestmentsState>()(
  persist(
    (set, get) => ({
      investments: [],
      investmentPrices: [],

      getInvestmentById: (investmentId) => {
        return get().investments.find((i) => i.id === investmentId);
      },

      getInvestmentsByAccount: (accountId) => {
        return get().investments.filter(
          (investment) => investment.account === accountId,
        );
      },

      getPricesByInvestment: (investmentId) => {
        return get().investmentPrices.filter(
          (price) => price.investment === investmentId,
        );
      },

      getPriceById: (priceId) => {
        return get().investmentPrices.find((p) => p.id === priceId);
      },

      addInvestment: (investment) => {
        set((state) => ({
          investments: [...state.investments, investment],
        }));
      },

      updateInvestment: (investmentId, update) => {
        set((state) => ({
          investments: state.investments.map((investment) => {
            if (investment.id === investmentId) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              return {
                ...investment,
                ...filteredUpdate,
              };
            }
            return investment;
          }),
        }));
      },

      // A deleted investment takes its price points with it: the
      // cascade owns them on the server too.
      deleteInvestment: (investmentId) => {
        set((state) => ({
          investments: state.investments.filter(
            (investment) => investment.id !== investmentId,
          ),
          investmentPrices: state.investmentPrices.filter(
            (price) => price.investment !== investmentId,
          ),
        }));
      },

      restoreInvestment: (investment, prices) => {
        set((state) => ({
          investments: [
            ...state.investments.filter((i) => i.id !== investment.id),
            investment,
          ],
          investmentPrices: [
            ...state.investmentPrices.filter(
              (existing) => !prices.some((price) => price.id === existing.id),
            ),
            ...prices,
          ],
        }));
      },

      // One price per day: a point for a day that already has one
      // replaces it, matching the server's upsert.
      addInvestmentPrice: (price) => {
        set((state) => ({
          investmentPrices: [
            ...state.investmentPrices.filter(
              (existing) =>
                !(
                  existing.investment === price.investment &&
                  sameDay(existing.date, price.date)
                ),
            ),
            price,
          ],
        }));
      },

      updateInvestmentPrice: (priceId, update) => {
        set((state) => ({
          investmentPrices: state.investmentPrices.map((price) => {
            if (price.id === priceId) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              return {
                ...price,
                ...filteredUpdate,
              };
            }
            return price;
          }),
        }));
      },

      deleteInvestmentPrice: (priceId) => {
        set((state) => ({
          investmentPrices: state.investmentPrices.filter(
            (price) => price.id !== priceId,
          ),
        }));
      },

      restoreInvestmentPrice: (price) => {
        set((state) => ({
          investmentPrices: [
            ...state.investmentPrices.filter((p) => p.id !== price.id),
            price,
          ],
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createInvestment") {
          get().addInvestment({ ...event.payload });
        } else if (event.type === "updateInvestment") {
          get().updateInvestment(event.payload.id, {
            ...event.payload,
          });
        } else if (event.type === "deleteInvestment") {
          get().deleteInvestment(event.payload.id);
        } else if (event.type === "addInvestmentPrice") {
          get().addInvestmentPrice({
            ...event.payload,
            date: new Date(event.payload.date),
          });
        } else if (event.type === "updateInvestmentPrice") {
          get().updateInvestmentPrice(event.payload.id, {
            ...(event.payload.date !== undefined
              ? { date: new Date(event.payload.date) }
              : {}),
            ...(event.payload.price !== undefined
              ? { price: event.payload.price }
              : {}),
          });
        } else if (event.type === "deleteInvestmentPrice") {
          get().deleteInvestmentPrice(event.payload.id);
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "createInvestment") {
          get().deleteInvestment(event.variables.id);
        } else if (event.name === "updateInvestment") {
          get().updateInvestment(event.variables.id, {
            ...event.rollbackData,
          });
        } else if (event.name === "deleteInvestment") {
          get().restoreInvestment(
            event.rollbackData.investment,
            event.rollbackData.prices,
          );
        } else if (event.name === "addInvestmentPrice") {
          get().deleteInvestmentPrice(event.variables.id);
        } else if (event.name === "updateInvestmentPrice") {
          get().restoreInvestmentPrice(event.rollbackData);
        } else if (event.name === "deleteInvestmentPrice") {
          get().restoreInvestmentPrice(event.rollbackData);
        }
      },
    }),
    {
      name: "investments",
      version: 1,
      storage: storage,
      migrate: (persisted) => {
        // Version 0 stored the position's current quantity; it became the
        // derived-from-ledger model's baseline, initialQuantity.
        const state = persisted as {
          investments?: Record<string, unknown>[];
        };
        if (state.investments) {
          state.investments = state.investments.map((investment) =>
            "initialQuantity" in investment
              ? investment
              : {
                  ...investment,
                  initialQuantity: investment.quantity ?? 0,
                },
          );
        }
        migrationFlags.refetchUserData = true;
        return state;
      },
    },
  ),
);
