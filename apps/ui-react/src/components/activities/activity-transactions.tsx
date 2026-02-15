import { type Activity, type Transaction } from "@maille/core/activities";
import { Trash2 } from "lucide-react";

import { AccountSelect } from "@/components/accounts/account-select";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrencyFormatter } from "@/lib/utils";
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
        <div className="text-sm font-medium ">Transactions</div>
        <div className="flex-1" />
        <div className="text-primary-100 mr-4 font-mono text-sm whitespace-nowrap">
          {currencyFormatter.format(transactionsSum)}
        </div>
        <AddTransactionButton activity={activity} />
      </div>

      <div className="bg-primary-800 mt-4 mb-2">
        {activity.transactions.length === 0 ? (
          <div className="text-primary-300 p-4 text-sm">
            No transaction added for this activity.
          </div>
        ) : (
          activity.transactions.map((transaction, index) => (
            <div
              key={transaction.id}
              className={`hover:bg-primary-700 flex h-10 items-center justify-center text-sm ${
                index !== activity.transactions.length - 1 && "border-b"
              }`}
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
                  console.log(amount);
                  handleTransactionUpdate(transaction, {
                    amount: amount || undefined,
                  });
                }}
                className="mr-1.5 w-24"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <span className="sr-only">Actions</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-primary-100"
                    >
                      <path d="M12 16a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-primary-700 border-primary-600">
                  <DropdownMenuItem
                    onClick={() => handleTransactionDelete(transaction)}
                    className="focus:bg-primary-600 text-red-400 focus:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
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
