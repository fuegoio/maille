import type { Activity, Transaction } from "@maille/core/activities";
import type { FundMove } from "@maille/core/funds";

import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";

import { useAccountDefaultFunds } from "@/hooks/use-account-default-funds";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import {
  addTransactionHistoryEvent,
  removeTransactionHistoryEvent,
  updateTransactionHistoryEvent,
} from "@/lib/history-events";
import { classifyFundMoves } from "@/logic/funds";
import {
  addTransactionMutation,
  updateTransactionMutation,
  deleteTransactionMutation,
} from "@/mutations/activities";
import { useAccounts } from "@/stores/accounts";
import { useSync } from "@/stores/sync";

import { Transaction as TransactionComponent } from "./transaction";
import { TransactionDropdown } from "./transaction-dropdown";

interface ActivityTransactionsProps {
  activity: Activity;
  /** The transaction to highlight, when the route links to one. */
  focusTransactionId?: string | null;
}

type StagedTransaction = Omit<Transaction, "id"> & { id: string };

export function ActivityTransactions({
  activity,
  focusTransactionId,
}: ActivityTransactionsProps) {
  const currencyFormatter = useCurrencyFormatter();
  const mutate = useSync((state) => state.mutate);
  const accounts = useAccounts((state) => state.accounts);
  const defaultFundByAccount = useAccountDefaultFunds();
  const [stagedTransactions, setStagedTransactions] = useState<
    StagedTransaction[]
  >([]);

  const transactionsSum = activity.transactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  const handleTransactionUpdate = (
    transaction: Transaction,
    updateData: Partial<Transaction> & { fundMoves?: FundMove[] },
  ) => {
    const { fundMoves, ...updateFields } = updateData;
    const oldTransaction = { ...transaction };
    const historyEvent = updateTransactionHistoryEvent(activity, transaction, {
      ...transaction,
      ...updateFields,
    });

    // Amount changes carry over to the transaction's fund moves so fund
    // balances stay in sync (same behavior as the create-activity modal)
    const updatedAmount = updateFields.amount;
    const effectiveFundMoves =
      fundMoves !== undefined
        ? fundMoves
        : updatedAmount !== undefined &&
            transaction.fundMoves &&
            transaction.fundMoves.length > 0
          ? transaction.fundMoves.map((move) => ({
              ...move,
              amount: updatedAmount,
            }))
          : undefined;

    mutate({
      name: "updateTransaction",
      mutation: updateTransactionMutation,
      variables: {
        activityId: activity.id,
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
            activityId: activity.id,
            id: transaction.id,
            ...updateFields,
            ...(effectiveFundMoves !== undefined
              ? {
                  fundMoves: effectiveFundMoves.map((move) => ({
                    ...move,
                    // The move belongs to the transaction being updated
                    transaction: transaction.id,
                    date: move.date.toISOString(),
                  })),
                }
              : {}),
          },
        },
        ...(historyEvent ? [historyEvent] : []),
      ],
    });
  };

  const handleTransactionDelete = (transaction: Transaction) => {
    mutate({
      name: "deleteTransaction",
      mutation: deleteTransactionMutation,
      variables: {
        activityId: activity.id,
        id: transaction.id,
      },
      rollbackData: transaction,
      events: [
        {
          type: "deleteTransaction",
          payload: {
            activityId: activity.id,
            id: transaction.id,
          },
        },
        removeTransactionHistoryEvent(activity, transaction),
      ],
    });
  };

  const handleApplyTemplate = (transactions: Omit<Transaction, "id">[]) => {
    // Clear existing transactions and add new ones from template
    activity.transactions.forEach((transaction) => {
      handleTransactionDelete(transaction);
    });

    transactions.forEach((transaction) => {
      // Templates carry no fund legs: classify each new leg into its
      // accounts' default funds
      const fundMoves = classifyFundMoves({
        fromAccount: transaction.fromAccount,
        toAccount: transaction.toAccount,
        amount: transaction.amount,
        accounts,
        defaultFundByAccount,
        date: activity.date,
      });

      mutate({
        name: "addTransaction",
        mutation: addTransactionMutation,
        variables: {
          activityId: activity.id,
          id: crypto.randomUUID(),
          amount: transaction.amount,
          fromAccount: transaction.fromAccount,
          fromAsset: transaction.fromAsset || null,
          fromCounterparty: transaction.fromCounterparty || null,
          toAccount: transaction.toAccount,
          toAsset: transaction.toAsset || null,
          toCounterparty: transaction.toCounterparty || null,
          fundMoves: fundMoves.map((move) => ({
            id: move.id,
            fromFund: move.fromFund,
            toFund: move.toFund,
            amount: move.amount,
            note: move.note,
          })),
        },
        rollbackData: undefined,
        events: [
          {
            type: "addTransaction",
            payload: {
              activityId: activity.id,
              id: crypto.randomUUID(),
              fundMoves: fundMoves.map((move) => ({
                ...move,
                date: move.date.toISOString(),
              })),
              amount: transaction.amount,
              fromAccount: transaction.fromAccount,
              fromAsset: transaction.fromAsset || null,
              fromCounterparty: transaction.fromCounterparty || null,
              toAccount: transaction.toAccount,
              toAsset: transaction.toAsset || null,
              toCounterparty: transaction.toCounterparty || null,
            },
          },
          addTransactionHistoryEvent(activity, transaction),
        ],
      });
    });
  };

  const commitTransaction = (transaction: StagedTransaction) => {
    // Staged legs have no accounts until both sides are known; the
    // classification happens here, and legs set by hand win over defaults.
    const fundMoves =
      transaction.fundMoves && transaction.fundMoves.length > 0
        ? transaction.fundMoves
        : classifyFundMoves({
            fromAccount: transaction.fromAccount,
            toAccount: transaction.toAccount,
            amount: transaction.amount,
            accounts,
            defaultFundByAccount,
            date: activity.date,
          });

    mutate({
      name: "addTransaction",
      mutation: addTransactionMutation,
      variables: {
        activityId: activity.id,
        id: transaction.id,
        fromAccount: transaction.fromAccount,
        toAccount: transaction.toAccount,
        amount: transaction.amount,
        fromAsset: transaction.fromAsset || null,
        fromCounterparty: transaction.fromCounterparty || null,
        toAsset: transaction.toAsset || null,
        toCounterparty: transaction.toCounterparty || null,
        fundMoves: fundMoves.map((move) => ({
          id: move.id,
          fromFund: move.fromFund,
          toFund: move.toFund,
          amount: move.amount,
          note: move.note,
        })),
      },
      rollbackData: undefined,
      events: [
        {
          type: "addTransaction",
          payload: {
            activityId: activity.id,
            id: transaction.id,
            fundMoves: fundMoves.map((move) => ({
              ...move,
              date: move.date.toISOString(),
            })),
            fromAccount: transaction.fromAccount,
            toAccount: transaction.toAccount,
            amount: transaction.amount,
            fromAsset: transaction.fromAsset || null,
            fromCounterparty: transaction.fromCounterparty || null,
            toAsset: transaction.toAsset || null,
            toCounterparty: transaction.toCounterparty || null,
          },
        },
        addTransactionHistoryEvent(activity, transaction),
      ],
    });
  };

  const handleStagedTransactionUpdate = (
    id: string,
    updateData: Partial<Transaction>,
  ) => {
    // Side effects stay out of the state updater — StrictMode double-invokes
    // updaters in dev, which would queue the commit mutation twice and fail
    // the second insert on the client-generated transaction id.
    const staged = stagedTransactions.find((t) => t.id === id);
    if (!staged) return;
    const transaction = { ...staged, ...updateData };
    if (transaction.fromAccount && transaction.toAccount) {
      commitTransaction(transaction);
      setStagedTransactions((prev) => prev.filter((t) => t.id !== id));
    } else {
      setStagedTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updateData } : t)),
      );
    }
  };

  const handleStagedTransactionDelete = (id: string) => {
    setStagedTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addTransaction = () => {
    const transactionId = crypto.randomUUID();
    const transaction: StagedTransaction = {
      id: transactionId,
      fromAccount: "",
      toAccount: "",
      amount: 0,
      fromAsset: null,
      fromCounterparty: null,
      toAsset: null,
      toCounterparty: null,
      // Each side lands in its account's default fund, so the new leg is
      // classified from the start
      fundMoves: classifyFundMoves({
        fromAccount: "",
        toAccount: "",
        amount: 0,
        accounts,
        defaultFundByAccount,
        date: activity.date,
      }),
    };

    // Accounts are unknown for a new leg — stage locally until both sides
    // are set, then commit
    setStagedTransactions((prev) => [...prev, transaction]);
  };

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="flex items-center">
        <div>
          <div className="flex items-center gap-1.5">
            <ArrowLeftRight className="size-3.5 text-muted-foreground" />
            <div className="text-base font-medium">Transactions</div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            The double-entry legs of this activity, from account to account.
          </div>
        </div>
        <div className="flex-1" />
        <div className="mr-4 font-mono text-sm whitespace-nowrap text-muted-foreground">
          {currencyFormatter.format(transactionsSum)}
        </div>
        {/* Right edge flush with the rows' action column (leg p-3 + border) */}
        <div className="mr-1 flex items-center gap-2">
          <TransactionDropdown
            transactions={activity.transactions.map((t) => ({
              fromAccount: t.fromAccount,
              fromAsset: t.fromAsset || null,
              fromCounterparty: t.fromCounterparty || null,
              toAccount: t.toAccount,
              toAsset: t.toAsset || null,
              toCounterparty: t.toCounterparty || null,
              amount: t.amount,
            }))}
            baseAmount={transactionsSum}
            onApplyTemplate={handleApplyTemplate}
            onAddTransaction={addTransaction}
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {activity.transactions.length === 0 &&
        stagedTransactions.length === 0 ? (
          <div className="py-4 text-sm text-muted-foreground">
            No transaction added for this activity.
          </div>
        ) : (
          <>
            {activity.transactions.map((transaction) => (
              <TransactionComponent
                key={transaction.id}
                variant="flat"
                transaction={transaction}
                isFocused={transaction.id === focusTransactionId}
                onUpdate={(update) =>
                  handleTransactionUpdate(transaction, update)
                }
                onDelete={() => handleTransactionDelete(transaction)}
              />
            ))}
            {stagedTransactions.map((transaction) => (
              <TransactionComponent
                key={transaction.id}
                variant="flat"
                transaction={transaction}
                isStaged
                onUpdate={(update) =>
                  handleStagedTransactionUpdate(transaction.id, update)
                }
                onDelete={() => handleStagedTransactionDelete(transaction.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
