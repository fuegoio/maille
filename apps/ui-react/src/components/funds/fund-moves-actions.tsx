import type { FundMove } from "@maille/core/funds";

import { DollarSign, Tag, Trash2 } from "lucide-react";
import * as React from "react";

import type { EntityAction } from "@/components/shared/entity-actions";

import { updateTransactionMutation } from "@/mutations/activities";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useSync } from "@/stores/sync";

type SelectedFundMove = {
  fundMove: FundMove;
  activityId: string;
  transactionId: string;
};

export function useFundMovesEntityActions(
  selectedFundMoves: string[],
  onClearSelection?: () => void,
): EntityAction[] {
  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);
  const funds = useFunds((state) => state.funds);

  const selectedFundMovesData = React.useMemo(() => {
    const result: SelectedFundMove[] = [];
    for (const activity of activities) {
      for (const transaction of activity.transactions) {
        for (const fundMove of transaction.fundMoves ?? []) {
          if (selectedFundMoves.includes(fundMove.id)) {
            result.push({
              fundMove,
              activityId: activity.id,
              transactionId: transaction.id,
            });
          }
        }
      }
    }
    return result;
  }, [selectedFundMoves, activities]);

  const updateFundMoves = React.useCallback(
    (update: {
      amount?: number;
      fromFund?: string | null;
      toFund?: string | null;
    }) => {
      selectedFundMovesData.forEach(
        ({ fundMove, activityId, transactionId }) => {
          const activity = activities.find((a) => a.id === activityId);
          if (!activity) return;
          const transaction = activity.transactions.find(
            (t) => t.id === transactionId,
          );
          if (!transaction) return;

          const oldTransaction = { ...transaction };

          const updatedFundMoves = (transaction.fundMoves ?? []).map((move) => {
            if (move.id !== fundMove.id) return move;
            return {
              ...move,
              ...(update.amount !== undefined ? { amount: update.amount } : {}),
              ...(update.fromFund !== undefined
                ? { fromFund: update.fromFund }
                : {}),
              ...(update.toFund !== undefined ? { toFund: update.toFund } : {}),
            };
          });

          const updateFields: { amount?: number } = {};
          if (update.amount !== undefined) {
            updateFields.amount = update.amount;
          }

          mutate({
            name: "updateTransaction",
            mutation: updateTransactionMutation,
            variables: {
              activityId,
              id: transactionId,
              ...updateFields,
              fundMoves: updatedFundMoves.map((move) => ({
                id: move.id,
                fromFund: move.fromFund,
                toFund: move.toFund,
                amount: move.amount,
                note: move.note,
              })),
            },
            rollbackData: oldTransaction,
            events: [
              {
                type: "updateTransaction",
                payload: {
                  activityId,
                  id: transactionId,
                  ...updateFields,
                  fundMoves: updatedFundMoves.map((move) => ({
                    id: move.id,
                    fromFund: move.fromFund,
                    toFund: move.toFund,
                    amount: move.amount,
                    note: move.note,
                    transaction: transactionId,
                    date: move.date.toISOString(),
                  })),
                },
              },
            ],
          });
        },
      );
    },
    [selectedFundMovesData, activities, mutate],
  );

  const deleteFundMoves = React.useCallback(() => {
    selectedFundMovesData.forEach(({ fundMove, activityId, transactionId }) => {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;
      const transaction = activity.transactions.find(
        (t) => t.id === transactionId,
      );
      if (!transaction) return;

      const oldTransaction = { ...transaction };
      const remainingFundMoves = (transaction.fundMoves ?? []).filter(
        (move) => move.id !== fundMove.id,
      );

      mutate({
        name: "updateTransaction",
        mutation: updateTransactionMutation,
        variables: {
          activityId,
          id: transactionId,
          fundMoves: remainingFundMoves.map((move) => ({
            id: move.id,
            fromFund: move.fromFund,
            toFund: move.toFund,
            amount: move.amount,
            note: move.note,
          })),
        },
        rollbackData: oldTransaction,
        events: [
          {
            type: "updateTransaction",
            payload: {
              activityId,
              id: transactionId,
              fundMoves: remainingFundMoves.map((move) => ({
                id: move.id,
                fromFund: move.fromFund,
                toFund: move.toFund,
                amount: move.amount,
                note: move.note,
                transaction: transactionId,
                date: move.date.toISOString(),
              })),
            },
          },
        ],
      });
    });
  }, [selectedFundMovesData, activities, mutate]);

  return React.useMemo(() => {
    const clearAndComplete = () => {
      onClearSelection?.();
    };

    return [
      {
        value: "amount",
        label: "Change amount",
        icon: <DollarSign />,
        type: "input" as const,
        placeholder: "Enter new amount...",
        defaultValue:
          selectedFundMovesData[0]?.fundMove.amount?.toString() || "",
        shortcut: "A",
        action: (value?: string) => {
          if (!value) return;
          const amount = parseFloat(value);
          if (!isNaN(amount)) {
            updateFundMoves({ amount });
          }
          clearAndComplete();
        },
      },
      {
        value: "fromFund",
        label: "Change from fund",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "F",
        getValues: () => {
          const fundOptions = funds.map((fund) => ({
            value: `fromFund-${fund.id}`,
            label: fund.name,
            icon: (
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
            ),
            action: () => {
              updateFundMoves({ fromFund: fund.id });
              clearAndComplete();
            },
          }));
          fundOptions.push({
            value: "fromFund-null",
            label: "Untracked",
            icon: (
              <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            ),
            action: () => {
              updateFundMoves({ fromFund: null });
              clearAndComplete();
            },
          });
          return fundOptions;
        },
      },
      {
        value: "toFund",
        label: "Change to fund",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "T",
        getValues: () => {
          const fundOptions = funds.map((fund) => ({
            value: `toFund-${fund.id}`,
            label: fund.name,
            icon: (
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
            ),
            action: () => {
              updateFundMoves({ toFund: fund.id });
              clearAndComplete();
            },
          }));
          fundOptions.push({
            value: "toFund-null",
            label: "Untracked",
            icon: (
              <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            ),
            action: () => {
              updateFundMoves({ toFund: null });
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
        variant: "destructive" as const,
        action: () => {
          deleteFundMoves();
          clearAndComplete();
        },
      },
    ];
  }, [
    selectedFundMovesData,
    funds,
    updateFundMoves,
    deleteFundMoves,
    onClearSelection,
  ]);
}
