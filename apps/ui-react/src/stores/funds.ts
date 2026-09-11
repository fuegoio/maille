import type { Fund, FundAllocation } from "@maille/core/funds";
import type { SyncEvent } from "@maille/core/sync";

import { DEFAULT_FUND_COLOR } from "@maille/core/funds";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { migrationFlags, storage } from "./storage";

interface FundsState {
  funds: Fund[];
  fundAllocations: FundAllocation[];

  getFundById: (fundId: string) => Fund | undefined;

  addFund: (fund: Fund) => void;
  updateFund: (fundId: string, update: Partial<Omit<Fund, "id">>) => void;
  deleteFund: (fundId: string) => void;
  restoreFund: (fund: Fund) => void;

  setFundAllocations: (fundId: string, allocations: FundAllocation[]) => void;

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (mutation: Mutation) => void;
  handleMutationError: (mutation: Mutation) => void;
}

export const useFunds = create<FundsState>()(
  persist(
    (set, get) => ({
      funds: [],
      fundAllocations: [],

      getFundById: (fundId) => {
        return get().funds.find((f) => f.id === fundId);
      },

      addFund: (fund) => {
        set((state) => ({
          funds: [...state.funds.filter((f) => f.id !== fund.id), fund],
        }));
      },

      updateFund: (fundId, update) => {
        set((state) => ({
          funds: state.funds.map((fund) =>
            fund.id === fundId ? { ...fund, ...update } : fund,
          ),
        }));
      },

      deleteFund: (fundId) => {
        set((state) => {
          const deleted = state.funds.find((fund) => fund.id === fundId);
          return {
            funds: state.funds
              .filter((fund) => fund.id !== fundId)
              // Splice, mirroring the server: the deleted fund's children
              // are promoted to its own parent.
              .map((fund) =>
                fund.parentFund === fundId
                  ? { ...fund, parentFund: deleted?.parentFund ?? null }
                  : fund,
              ),
            fundAllocations: state.fundAllocations.filter(
              (allocation) => allocation.fund !== fundId,
            ),
          };
        });
      },

      restoreFund: (fund) => {
        set((state) => ({
          funds: [...state.funds.filter((f) => f.id !== fund.id), fund],
        }));
      },

      setFundAllocations: (fundId, allocations) => {
        set((state) => ({
          fundAllocations: [
            ...state.fundAllocations.filter(
              (allocation) => allocation.fund !== fundId,
            ),
            ...allocations.filter((allocation) => allocation.fund === fundId),
          ],
        }));
      },

      handleEvent: (event) => {
        if (event.type === "createFund") {
          get().addFund({
            id: event.payload.id,
            name: event.payload.name,
            color: event.payload.color,
            startDate: event.payload.startDate
              ? new Date(event.payload.startDate)
              : null,
            endDate: event.payload.endDate
              ? new Date(event.payload.endDate)
              : null,
            parentFund: event.payload.parentFund,
          });
        } else if (event.type === "updateFund") {
          get().updateFund(event.payload.id, {
            ...(event.payload.name !== undefined
              ? { name: event.payload.name }
              : {}),
            ...(event.payload.color !== undefined
              ? { color: event.payload.color }
              : {}),
            ...(event.payload.startDate !== undefined
              ? {
                  startDate: event.payload.startDate
                    ? new Date(event.payload.startDate)
                    : null,
                }
              : {}),
            ...(event.payload.endDate !== undefined
              ? {
                  endDate: event.payload.endDate
                    ? new Date(event.payload.endDate)
                    : null,
                }
              : {}),
            ...(event.payload.parentFund !== undefined
              ? { parentFund: event.payload.parentFund }
              : {}),
          });
        } else if (event.type === "deleteFund") {
          get().deleteFund(event.payload.id);
        } else if (event.type === "updateFundAllocations") {
          get().setFundAllocations(
            event.payload.fund,
            event.payload.allocations.map((allocation) => ({
              ...allocation,
              fund: event.payload.fund,
            })),
          );
        }
      },

      handleMutationSuccess: (mutation) => {
        if (!mutation.result) return;
      },

      handleMutationError: (mutation) => {
        if (mutation.name === "createFund") {
          get().deleteFund(mutation.variables.id);
        } else if (mutation.name === "updateFund") {
          get().updateFund(mutation.variables.id, {
            ...mutation.rollbackData,
          });
        } else if (mutation.name === "deleteFund") {
          get().restoreFund(mutation.rollbackData);
        } else if (mutation.name === "setFundAllocations") {
          get().setFundAllocations(
            mutation.variables.fund,
            mutation.rollbackData,
          );
        }
      },
    }),
    {
      name: "funds",
      version: 4,
      storage,
      migrate: (persisted, version) => {
        const state = persisted as {
          funds?: Fund[];
          fundAllocations?: FundAllocation[];
          fundMoves?: unknown;
        };
        // Fund moves moved onto their transactions: the collection is gone.
        delete state.fundMoves;
        if (state.funds) {
          state.funds = state.funds.map((fund) => ({
            ...fund,
            color: fund.color ?? DEFAULT_FUND_COLOR,
            parentFund: fund.parentFund ?? null,
          }));
        }
        if (version < 3) {
          // Opening allocations arrive with the positions feature: older
          // persisted states never saw them, so refetch from the server.
          state.fundAllocations = [];
          migrationFlags.refetchUserData = true;
        }
        return state;
      },
      partialize: (state) => ({
        funds: state.funds,
        fundAllocations: state.fundAllocations,
      }),
    },
  ),
);
