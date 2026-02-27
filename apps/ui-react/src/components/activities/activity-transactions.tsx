import { type Activity, type Transaction } from "@maille/core/activities";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import {
  updateTransactionMutation,
  deleteTransactionMutation,
} from "@/mutations/activities";
import { useSync } from "@/stores/sync";

import { AddTransactionButton } from "./add-transaction-button";
import { Transaction as TransactionComponent } from "./transaction";

interface ActivityTransactionsProps {
  activity: Activity;
}

export function ActivityTransactions({ activity }: ActivityTransactionsProps) {
  const currencyFormatter = useCurrencyFormatter();
  const mutate = useSync((state) => state.mutate);

  const transactionsSum = activity.transactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  const handleTransactionUpdate = (
    transaction: Transaction,
    updateData: Partial<Transaction>,
  ) => {
    const oldTransaction = { ...transaction };
    mutate({
      name: "updateTransaction",
      mutation: updateTransactionMutation,
      variables: {
        activityId: activity.id,
        id: transaction.id,
        ...updateData,
      },
      rollbackData: oldTransaction,
      events: [
        {
          type: "updateTransaction",
          payload: {
            activityId: activity.id,
            id: transaction.id,
            ...updateData,
          },
        },
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
      ],
    });
  };

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="flex items-center">
        <div className="text-sm font-medium">Transactions</div>
        <div className="flex-1" />
        <div className="mr-4 font-mono text-sm whitespace-nowrap text-muted-foreground">
          {currencyFormatter.format(transactionsSum)}
        </div>
        <AddTransactionButton activity={activity} />
      </div>

      <div className="my-2">
        {activity.transactions.length === 0 ? (
          <div className="py-4 text-sm text-muted-foreground">
            No transaction added for this activity.
          </div>
        ) : (
          activity.transactions.map((transaction, index) => (
            <TransactionComponent
              key={transaction.id}
              className={cn(
                "pr-1",
                index !== activity.transactions.length - 1 ? "border-b" : "",
              )}
              transaction={transaction}
              onUpdate={(update) =>
                handleTransactionUpdate(transaction, update)
              }
              onDelete={() => handleTransactionDelete(transaction)}
            />
          ))
        )}
      </div>
    </div>
  );
}
