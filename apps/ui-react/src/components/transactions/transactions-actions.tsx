import type { Transaction } from "@maille/core/activities";
import type { Fund, FundMove } from "@maille/core/funds";

import { AccountType } from "@maille/core/accounts";
import { DollarSign, Tag, Trash2 } from "lucide-react";
import * as React from "react";

import type { EntityAction } from "@/components/shared/entity-actions";

import {
  removeTransactionHistoryEvent,
  updateTransactionHistoryEvent,
} from "@/lib/history-events";
import { cn } from "@/lib/utils";
import {
  deleteTransactionMutation,
  updateTransactionMutation,
} from "@/mutations/activities";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useSync } from "@/stores/sync";

import { fundScopeLegs, type TransactionViewFilter } from "./transaction-view";

type SelectedTransaction = {
  transaction: Transaction;
  activityId: string;
};

export function useTransactionsEntityActions(
  /** The side the selecting view shows the transactions from. */
  filter: TransactionViewFilter,
  selectedTransactions: string[],
  onClearSelection?: () => void,
): EntityAction[] {
  const mutate = useSync((state) => state.mutate);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const funds = useFunds((state) => state.funds);

  const selectedTransactionsData = React.useMemo(() => {
    const result: SelectedTransaction[] = [];
    for (const activity of activities) {
      for (const transaction of activity.transactions) {
        if (selectedTransactions.includes(transaction.id)) {
          result.push({ transaction, activityId: activity.id });
        }
      }
    }
    return result;
  }, [selectedTransactions, activities]);

  /**
   * The transaction's legs crossing the view's fund scope, when the
   * view is a fund's: the parts of the transaction this page tracks.
   */
  const scopeLegsOf = React.useCallback(
    (transaction: Transaction) =>
      filter.kind === "fund"
        ? fundScopeLegs(
            transaction,
            { fundId: filter.fundId, subtree: filter.subtree ?? false },
            accounts,
            funds,
          )
        : [],
    [filter, accounts, funds],
  );

  const updateTransactions = React.useCallback(
    (update: {
      amount?: number;
      /** Retargets the counterpart account: the side the view does not hold. */
      account?: string;
      /** Sets the view's side of the transaction's fund legs; null means Untracked. */
      fund?: string | null;
    }) => {
      selectedTransactionsData.forEach(({ transaction, activityId }) => {
        const activity = activities.find((a) => a.id === activityId);
        if (!activity) return;

        const oldTransaction = { ...transaction };

        const updateFields: Pick<
          Partial<Transaction>,
          "amount" | "fromAccount" | "toAccount"
        > = {};
        if (update.amount !== undefined) updateFields.amount = update.amount;
        if (update.account !== undefined) {
          if (filter.kind === "account") {
            if (transaction.fromAccount === filter.accountId) {
              updateFields.toAccount = update.account;
            } else {
              updateFields.fromAccount = update.account;
            }
          } else if (filter.kind === "month") {
            // The month view reads from the balance sheet: retarget the
            // outside side on revenue and expense transactions, the
            // receiving account on internal transfers.
            const isBalanceAccount = (accountId: string) => {
              const type = accounts.find(
                (account) => account.id === accountId,
              )?.type;
              return (
                type !== AccountType.EXPENSE && type !== AccountType.REVENUE
              );
            };
            if (!isBalanceAccount(transaction.fromAccount)) {
              updateFields.fromAccount = update.account;
            } else {
              updateFields.toAccount = update.account;
            }
          } else {
            // A fund view holds no account of its own: the counterpart
            // is the account the money flows from on its way in, or to
            // on its way out.
            const direction = scopeLegsOf(transaction)[0]?.direction;
            if (direction === "in") updateFields.fromAccount = update.account;
            else updateFields.toAccount = update.account;
          }
        }

        // Fund legs follow the transaction.tsx canonical shape: one leg
        // holding the from and to funds, Untracked sides as null. A fund
        // view retargets the legs crossing its scope instead, leaving
        // every other leg alone; an amount change carries over to the
        // existing legs.
        const existingFundMoves = transaction.fundMoves ?? [];
        let effectiveFundMoves: FundMove[] | undefined;
        if (update.fund !== undefined && filter.kind === "account") {
          const trackedFromFund =
            existingFundMoves.find((m) => m.fromFund)?.fromFund ?? null;
          const trackedToFund =
            existingFundMoves.find((m) => m.toFund)?.toFund ?? null;
          const fromFund =
            transaction.fromAccount === filter.accountId
              ? update.fund
              : trackedFromFund;
          const toFund =
            transaction.fromAccount === filter.accountId
              ? trackedToFund
              : update.fund;
          effectiveFundMoves =
            fromFund !== null || toFund !== null
              ? [
                  {
                    id: crypto.randomUUID(),
                    fromFund,
                    toFund,
                    amount: update.amount ?? transaction.amount,
                    note: null,
                    date: new Date(),
                    transaction: null,
                  },
                ]
              : [];
        } else if (update.fund !== undefined && filter.kind === "fund") {
          // Retarget the scope's side of every boundary leg; legs whose
          // both sides end up null carry no fund and are dropped.
          const targetFund = update.fund;
          const scopeSides = new Map(
            scopeLegsOf(transaction).map((scopeLeg) => [
              scopeLeg.leg.id,
              scopeLeg.side,
            ]),
          );
          effectiveFundMoves = existingFundMoves
            .map((move): FundMove => {
              const side = scopeSides.get(move.id);
              if (side === undefined) return move;
              return side === "fromFund"
                ? { ...move, fromFund: targetFund }
                : { ...move, toFund: targetFund };
            })
            .filter((move) => move.fromFund !== null || move.toFund !== null);
        } else if (
          update.amount !== undefined &&
          existingFundMoves.length > 0
        ) {
          effectiveFundMoves = existingFundMoves.map(
            (move): FundMove => ({
              ...move,
              amount: update.amount as number,
            }),
          );
        }

        const historyEvent = updateTransactionHistoryEvent(
          activity,
          transaction,
          {
            ...transaction,
            ...updateFields,
          },
        );

        const serializedFundMoves =
          effectiveFundMoves !== undefined
            ? effectiveFundMoves.map((move) => ({
                id: move.id,
                fromFund: move.fromFund,
                toFund: move.toFund,
                amount: move.amount,
                note: move.note,
                transaction: transaction.id,
                date: move.date.toISOString(),
              }))
            : undefined;

        mutate({
          name: "updateTransaction",
          mutation: updateTransactionMutation,
          variables: {
            activityId,
            id: transaction.id,
            ...updateFields,
            ...(effectiveFundMoves !== undefined
              ? {
                  fundMoves: effectiveFundMoves.map((move) => ({
                    id: move.id,
                    fromFund: move.fromFund,
                    toFund: move.toFund,
                    amount: move.amount,
                    note: move.note,
                  })),
                }
              : {}),
          },
          rollbackData: oldTransaction,
          events: [
            {
              type: "updateTransaction",
              payload: {
                activityId,
                id: transaction.id,
                ...updateFields,
                ...(serializedFundMoves !== undefined
                  ? { fundMoves: serializedFundMoves }
                  : {}),
              },
            },
            ...(historyEvent ? [historyEvent] : []),
          ],
        });
      });
    },
    [
      selectedTransactionsData,
      activities,
      mutate,
      filter,
      scopeLegsOf,
      accounts,
    ],
  );

  const deleteTransactions = React.useCallback(() => {
    selectedTransactionsData.forEach(({ transaction, activityId }) => {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      mutate({
        name: "deleteTransaction",
        mutation: deleteTransactionMutation,
        variables: {
          activityId,
          id: transaction.id,
        },
        rollbackData: transaction,
        events: [
          {
            type: "deleteTransaction",
            payload: {
              activityId,
              id: transaction.id,
            },
          },
          removeTransactionHistoryEvent(activity, transaction),
        ],
      });
    });
  }, [selectedTransactionsData, activities, mutate]);

  return React.useMemo(() => {
    const clearAndComplete = () => {
      onClearSelection?.();
    };

    const actions: EntityAction[] = [
      {
        value: "amount",
        label: "Change amount",
        icon: <DollarSign />,
        type: "input",
        placeholder: "Enter new amount...",
        defaultValue:
          selectedTransactionsData[0]?.transaction.amount?.toString() || "",
        shortcut: "A",
        action: (value?: string) => {
          if (value === undefined) return;
          const amount = parseFloat(value);
          if (!isNaN(amount)) {
            updateTransactions({ amount });
          }
          clearAndComplete();
        },
      },
      {
        value: "account",
        label: "Change account",
        icon: <Tag />,
        type: "select",
        shortcut: "C",
        getValues: () => {
          return accounts
            .filter(
              (account) =>
                !(filter.kind === "account" && account.id === filter.accountId),
            )
            .map((account) => ({
              value: `account-${account.id}`,
              label: account.name,
              icon: (
                <div
                  className={cn(
                    "size-3 shrink-0 rounded-xl",
                    ACCOUNT_TYPES_COLOR[account.type],
                  )}
                />
              ),
              action: () => {
                updateTransactions({ account: account.id });
                clearAndComplete();
              },
            }));
        },
      },
      {
        value: "fund",
        label: "Change fund",
        icon: <Tag />,
        type: "select",
        shortcut: "F",
        getValues: () => {
          const fundOptions: {
            value: string;
            label: string;
            icon: React.ReactNode;
            action: () => void;
          }[] = funds.map((fund: Fund) => ({
            value: `fund-${fund.id}`,
            label: fund.name,
            icon: (
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
            ),
            action: () => {
              updateTransactions({ fund: fund.id });
              clearAndComplete();
            },
          }));
          fundOptions.push({
            value: "fund-null",
            label: "Untracked",
            icon: (
              <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            ),
            action: () => {
              updateTransactions({ fund: null });
              clearAndComplete();
            },
          });
          return fundOptions;
        },
      },
      {
        value: "delete",
        label: "Delete",
        icon: <Trash2 />,
        type: null,
        shortcut: "Del",
        variant: "destructive",
        action: () => {
          deleteTransactions();
          clearAndComplete();
        },
      },
    ];
    // A month view holds no fund side of its own, so fund retargeting
    // has nothing to retarget there.
    return filter.kind === "month"
      ? actions.filter((action) => action.value !== "fund")
      : actions;
  }, [
    selectedTransactionsData,
    accounts,
    funds,
    updateTransactions,
    deleteTransactions,
    filter,
    onClearSelection,
  ]);
}
