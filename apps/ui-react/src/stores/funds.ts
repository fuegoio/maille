import type { Fund, FundMove } from "@maille/core/funds";
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
        set((state) => ({
          funds: state.funds.filter((fund) => fund.id !== fundId),
          // The deleted fund's legs go back to Untracked server-side; legs
          // left with both sides untracked carry no information and go.
          fundMoves: state.fundMoves
            .map((move) => ({
              ...move,
              fromFund: move.fromFund === fundId ? null : move.fromFund,
              toFund: move.toFund === fundId ? null : move.toFund,
            }))
            .filter((move) => move.fromFund !== null || move.toFund !== null),
        }));
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
          });
        } else if (event.type === "deleteFund") {
          get().deleteFund(event.payload.id);
        } else if (event.type === "createFundMove") {
          get().addFundMove(toFundMove(event.payload));
        } else if (event.type === "updateFundMove") {
          const { id, date, ...update } = event.payload;
          get().updateFundMove(id, {
            ...update,
            ...(date !== undefined && date !== null
              ? { date: new Date(date) }
              : {}),
          });
        } else if (event.type === "deleteFundMove") {
          get().deleteFundMove(event.payload.id);
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
        } else if (mutation.name === "createFundMove") {
          get().deleteFundMove(mutation.variables.id);
        } else if (mutation.name === "updateFundMove") {
          get().updateFundMove(mutation.variables.id, {
            ...mutation.rollbackData,
          });
        } else if (mutation.name === "deleteFundMove") {
          get().restoreFundMove(mutation.rollbackData);
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
      version: 1,
      storage,
      migrate: (persisted) => {
        const state = persisted as { funds?: Fund[] };
        if (state.funds) {
          state.funds = state.funds.map((fund) =>
            fund.color ? fund : { ...fund, color: DEFAULT_FUND_COLOR },
          );
        }
        migrationFlags.refetchUserData = true;
        return state;
      },
      partialize: (state) => ({
        funds: state.funds,
        fundMoves: state.fundMoves,
      }),
    },
  ),
);
