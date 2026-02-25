import { type Activity } from "@maille/core/activities";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";

import { AddTransactionButton } from "./add-transaction-button";
import { Transaction } from "./transaction";

interface ActivityTransactionsProps {
  activity: Activity;
}

export function ActivityTransactions({ activity }: ActivityTransactionsProps) {
  const currencyFormatter = useCurrencyFormatter();

  const transactionsSum = activity.transactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

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
            <Transaction
              key={transaction.id}
              activity={activity}
              className={
                index !== activity.transactions.length - 1 ? "border-b" : ""
              }
              transaction={transaction}
            />
          ))
        )}
      </div>
    </div>
  );
}
