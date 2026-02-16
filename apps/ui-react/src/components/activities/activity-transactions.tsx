import { type Activity, type Transaction } from "@maille/core/activities";
import { Ellipsis, TrashIcon } from "lucide-react";

import { AccountSelect } from "@/components/accounts/account-select";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getCurrencyFormatter } from "@/lib/utils";
import {
  updateTransactionMutation,
  deleteTransactionMutation,
} from "@/mutations/activities";
import { useSync } from "@/stores/sync";

import { AddTransactionButton } from "./add-transaction-button";

interface ActivityTransactionsProps {
  activity: Activity;
}

export function ActivityTransactions({ activity }: ActivityTransactionsProps) {
  const mutate = useSync((state) => state.mutate);
  const currencyFormatter = getCurrencyFormatter();

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
            <div
              key={transaction.id}
              className={cn(
                "flex items-center justify-center py-2 text-sm",
                index !== activity.transactions.length - 1 && "border-b",
              )}
            >
              <AccountSelect
                value={transaction.fromAccount}
                onChange={(account) =>
                  handleTransactionUpdate(transaction, {
                    fromAccount: account as string,
                  })
                }
              />
              <div className="text-primary-200 mx-2 text-center">to</div>
              <AccountSelect
                value={transaction.toAccount}
                onChange={(account) =>
                  handleTransactionUpdate(transaction, {
                    toAccount: account as string,
                  })
                }
              />

              <div className="flex-1" />

              <AmountInput
                value={transaction.amount}
                onChange={(amount) => {
                  handleTransactionUpdate(transaction, {
                    amount,
                  });
                }}
                mode="cell"
                className="mr-1.5 w-24"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => handleTransactionDelete(transaction)}
                  >
                    <TrashIcon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
