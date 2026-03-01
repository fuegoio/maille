import { AccountType } from "@maille/core/accounts";
import {
  ActivityType,
  type Activity,
  type Transaction,
} from "@maille/core/activities";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
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
}

export function ActivityTransactions({ activity }: ActivityTransactionsProps) {
  const currencyFormatter = useCurrencyFormatter();
  const mutate = useSync((state) => state.mutate);
  const accounts = useAccounts((state) => state.accounts);

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

  const handleApplyTemplate = (transactions: Omit<Transaction, "id">[]) => {
    // Clear existing transactions and add new ones from template
    activity.transactions.forEach((transaction) => {
      handleTransactionDelete(transaction);
    });

    transactions.forEach((transaction) => {
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
        },
        rollbackData: undefined,
        events: [
          {
            type: "addTransaction",
            payload: {
              activityId: activity.id,
              id: crypto.randomUUID(),
              amount: transaction.amount,
              fromAccount: transaction.fromAccount,
              fromAsset: transaction.fromAsset || null,
              fromCounterparty: transaction.fromCounterparty || null,
              toAccount: transaction.toAccount,
              toAsset: transaction.toAsset || null,
              toCounterparty: transaction.toCounterparty || null,
            },
          },
        ],
      });
    });
  };

  // Guess best transaction accounts based on type
  const guessBestTransaction = () => {
    const type = activity.type;
    let fromAccount: string | undefined;
    let toAccount: string | undefined;

    if (type === ActivityType.EXPENSE) {
      fromAccount = accounts.find(
        (a) => a.type === AccountType.BANK_ACCOUNT,
      )?.id;
      toAccount = accounts.find((a) => a.type === AccountType.EXPENSE)?.id;
    } else if (type === ActivityType.REVENUE) {
      fromAccount = accounts.find((a) => a.type === AccountType.REVENUE)?.id;
      toAccount = accounts.find((a) => a.type === AccountType.BANK_ACCOUNT)?.id;
    } else if (type === ActivityType.INVESTMENT) {
      fromAccount = accounts.find(
        (a) => a.type === AccountType.BANK_ACCOUNT,
      )?.id;
      toAccount = accounts.find(
        (a) => a.type === AccountType.INVESTMENT_ACCOUNT,
      )?.id;
    }

    return { fromAccount, toAccount };
  };

  const addTransaction = () => {
    const { fromAccount, toAccount } = guessBestTransaction();

    const transactionId = crypto.randomUUID();
    const transaction = {
      id: transactionId,
      fromAccount: fromAccount || "",
      toAccount: toAccount || "",
      amount: 0,
    };

    mutate({
      name: "addTransaction",
      mutation: addTransactionMutation,
      variables: {
        activityId: activity.id,
        ...transaction,
      },
      rollbackData: undefined,
      events: [
        {
          type: "addTransaction",
          payload: {
            activityId: activity.id,
            ...transaction,
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
        <div className="flex items-center gap-2">
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
