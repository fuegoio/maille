import { type Activity, type Transaction } from "@maille/core/activities";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Trash2 } from "lucide-react";
import { useState } from "react";

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
import { useActivities } from "@/stores/activities";
import { useSync } from "@/stores/sync";

import { AddTransactionButton } from "./add-transaction-button";

interface ActivityTransactionsProps {
  activity: Activity;
}

export function ActivityTransactions({ activity }: ActivityTransactionsProps) {
  const currencyFormatter = getCurrencyFormatter();
  const [showTransactions, setShowTransactions] = useState(true);

  const transactionsSum = activity.transactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  const handleTransactionUpdate = (
    transaction: Transaction,
    updateData: Partial<Transaction>,
  ) => {
    const oldTransaction = { ...transaction };
    const updateTransaction = useActivities((state) => state.updateTransaction);
    updateTransaction(activity.id, transaction.id, updateData);

    const mutate = useSync((state) => state.mutate);
    mutate({
      name: "updateTransaction",
      mutation: updateTransactionMutation,
      variables: {
        activityId: activity.id,
        id: transaction.id,
        ...updateData,
      },
      rollbackData: oldTransaction,
    });
  };

  const handleTransactionDelete = (transaction: Transaction) => {
    const deleteTransaction = useActivities((state) => state.deleteTransaction);
    deleteTransaction(activity.id, transaction.id);

    mutate({
      name: "deleteTransaction",
      mutation: deleteTransactionMutation,
      variables: {
        activityId: activity.id,
        id: transaction.id,
      },
      rollbackData: transaction,
    });
  };

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="flex items-center">
        <button
          className="text-primary-100 -ml-2 flex h-7 items-center rounded px-2 text-sm font-medium hover:text-white"
          onClick={() => setShowTransactions(!showTransactions)}
        >
          Transactions
          {showTransactions ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronUp className="ml-2 h-4 w-4" />
          )}
        </button>

        <div className="flex-1" />

        {showTransactions && (
          <>
            <div className="text-primary-100 mr-4 font-mono text-sm whitespace-nowrap">
              {currencyFormatter.format(transactionsSum)}
            </div>
            <AddTransactionButton activity={activity} />
          </>
        )}
      </div>

      {showTransactions && (
        <div className="bg-primary-800 -mx-4 mt-4 mb-2 rounded border sm:-mx-8">
          {activity.transactions.length === 0 ? (
            <div className="text-primary-300 p-4 text-sm">
              No transaction added for this activity.
            </div>
          ) : (
            activity.transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`hover:bg-primary-700 flex h-10 items-center justify-center px-4 text-sm ${
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
                  borderless
                  className="w-40 pl-0"
                />
                <div className="text-primary-200 mx-2 text-center">to</div>
                <AccountSelect
                  value={transaction.toAccount}
                  onChange={(account) =>
                    handleTransactionUpdate(transaction, {
                      toAccount: account as string,
                    })
                  }
                  borderless
                  className="w-40"
                />

                <div className="flex-1" />

                <AmountInput
                  value={transaction.amount}
                  onChange={(amount) =>
                    handleTransactionUpdate(transaction, { amount })
                  }
                  className="mr-4 w-24"
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
      )}
    </div>
  );
}
