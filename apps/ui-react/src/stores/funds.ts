import type { Fund, FundAccount, FundMove } from "@maille/core/funds";
import type { SerializedFundMove, SyncEvent } from "@maille/core/sync";

import { DEFAULT_FUND_COLOR } from "@maille/core/funds";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { useActivities } from "./activities";
import { migrationFlags, storage } from "./storage";

interface FundsState {
  funds: Fund[];
  fundMoves: FundMove[];

  getFundById: (fundId: string) => Fund | undefined;

  addFund: (fund: Fund) => void;
  updateFund: (fundId: string, update: Partial<Omit<Fund, "id">>) => void;
  deleteFund: (fundId: string) => void;
  restoreFund: (fund: Fund) => void;

  addFundMove: (fundMove: FundMove) => void;
  updateFundMove: (
    fundMoveId: string,
    update: Partial<Omit<FundMove, "id">>,
  ) => void;
  deleteFundMove: (fundMoveId: string) => void;
  restoreFundMove: (fundMove: FundMove) => void;

  setFundAccounts: (fundId: string, accounts: FundAccount[]) => void;

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (mutation: Mutation) => void;
  handleMutationError: (mutation: Mutation) => void;
}

const toFundMove = (payload: SerializedFundMove): FundMove => ({
  ...payload,
  date: new Date(payload.date),
});

export const useFunds = create<FundsState>()(
  persist(
    (set, get) => ({
      funds: [],
      fundMoves: [],

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
            // The deleted fund's legs go back to Untracked server-side; legs
            // left with both sides untracked carry no information and go.
            fundMoves: state.fundMoves
              .map((move) => ({
                ...move,
                fromFund: move.fromFund === fundId ? null : move.fromFund,
                toFund: move.toFund === fundId ? null : move.toFund,
              }))
              .filter((move) => move.fromFund !== null || move.toFund !== null),
          };
        });
      },

      restoreFund: (fund) => {
        set((state) => ({
          funds: [...state.funds.filter((f) => f.id !== fund.id), fund],
        }));
      },

      addFundMove: (fundMove) => {
        set((state) => ({
          fundMoves: [
            ...state.fundMoves.filter((m) => m.id !== fundMove.id),
            fundMove,
          ],
        }));
      },

      updateFundMove: (fundMoveId, update) => {
        set((state) => ({
          fundMoves: state.fundMoves.map((move) =>
            move.id === fundMoveId ? { ...move, ...update } : move,
          ),
        }));
      },

      deleteFundMove: (fundMoveId) => {
        set((state) => ({
          fundMoves: state.fundMoves.filter((move) => move.id !== fundMoveId),
        }));
      },

      restoreFundMove: (fundMove) => {
        set((state) => ({
          fundMoves: [
            ...state.fundMoves.filter((m) => m.id !== fundMove.id),
            fundMove,
          ],
        }));
      },

      setFundAccounts: (fundId, accounts) => {
        set((state) => ({
          funds: state.funds.map((fund) =>
            fund.id === fundId ? { ...fund, accounts } : fund,
          ),
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
            accounts: [],
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
        } else if (event.type === "updateFundAccounts") {
          get().setFundAccounts(
            event.payload.fund,
            event.payload.accounts.map((account) => ({
              ...account,
              fund: event.payload.fund,
            })),
          );
        } else if (event.type === "createActivity") {
          event.payload.transactions?.forEach((transaction) => {
            transaction.fundMoves?.forEach((move) => {
              get().addFundMove(toFundMove(move));
            });
          });
        } else if (event.type === "addTransaction") {
          event.payload.fundMoves?.forEach((move) => {
            get().addFundMove(toFundMove(move));
          });
        } else if (event.type === "updateTransaction") {
          if (event.payload.fundMoves !== undefined) {
            // Replace all legs of this transaction
            set((state) => ({
              fundMoves: [
                ...state.fundMoves.filter(
                  (m) => m.transaction !== event.payload.id,
                ),
                ...event.payload.fundMoves!.map((move) => toFundMove(move)),
              ],
            }));
          }
        } else if (event.type === "deleteTransaction") {
          set((state) => ({
            fundMoves: state.fundMoves.filter(
              (m) => m.transaction !== event.payload.id,
            ),
          }));
        } else if (event.type === "deleteActivity") {
          // Transactions cascade server-side; remove their fund legs
          const transactions = useActivities
            .getState()
            .activities.find((a) => a.id === event.payload.id)
            ?.transactions.map((t) => t.id);
          if (transactions) {
            set((state) => ({
              fundMoves: state.fundMoves.filter(
                (m) => !m.transaction || !transactions.includes(m.transaction),
              ),
            }));
          }
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
        } else if (mutation.name === "setFundAccounts") {
          get().setFundAccounts(mutation.variables.fund, mutation.rollbackData);
        } else if (mutation.name === "addTransaction") {
          const addTransactionEvent = mutation.events[0];
          if (addTransactionEvent.type === "addTransaction") {
            addTransactionEvent.payload.fundMoves?.forEach((move) => {
              get().deleteFundMove(move.id);
            });
          }
        } else if (mutation.name === "deleteTransaction") {
          mutation.rollbackData.fundMoves?.forEach((move) => {
            get().restoreFundMove(move);
          });
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
          fundAllocations?: FundAccount[];
        };
        if (state.funds) {
          state.funds = state.funds.map((fund) => ({
            ...fund,
            color: fund.color ?? DEFAULT_FUND_COLOR,
            parentFund: fund.parentFund ?? null,
            accounts: fund.accounts ?? [],
          }));
        }
        if (version < 3) {
          // Opening allocations arrive with the positions feature: older
          // persisted states never saw them, so refetch from the server.
          migrationFlags.refetchUserData = true;
        }
        if (version < 4) {
          // Allocations moved from a separate array to Fund.accounts: refetch
          // to get the new shape.
          migrationFlags.refetchUserData = true;
        }
        return state;
      },
      partialize: (state) => ({
        funds: state.funds,
        fundMoves: state.fundMoves,
      }),
    },
  ),
);
