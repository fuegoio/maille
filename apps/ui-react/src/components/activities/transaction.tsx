import { AccountType } from "@maille/core/accounts";
import type { Activity, Transaction } from "@maille/core/activities";
import { CornerDownRight, Ellipsis, MoveRight, TrashIcon } from "lucide-react";

import { AccountSelect } from "@/components/accounts/account-select";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  updateTransactionMutation,
  deleteTransactionMutation,
} from "@/mutations/activities";
import { useAccounts } from "@/stores/accounts";
import { useSync } from "@/stores/sync";

import { AssetSelect } from "../accounts/assets/assets-select";
import { CounterpartiesSelect } from "../accounts/counterparties/counterparties-select";

interface TransactionProps {
  activity: Activity;
  transaction: Transaction;
  className?: string;
}

export function Transaction({
  activity,
  transaction,
  className,
}: TransactionProps) {
  const mutate = useSync((state) => state.mutate);
  const accounts = useAccounts((state) => state.accounts);

  const fromAccount = accounts.find((a) => a.id === transaction.fromAccount);
  const toAccount = accounts.find((a) => a.id === transaction.toAccount);

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
    <div className={cn("flex items-start py-2 text-sm", className)}>
      <div className="flex flex-col gap-2">
        <AccountSelect
          value={transaction.fromAccount}
          onChange={(account) =>
            handleTransactionUpdate(transaction, {
              fromAccount: account,
              fromCounterparty: null,
              fromAsset: null,
            })
          }
        />
        {fromAccount?.type === AccountType.LIABILITIES && (
          <div className="flex items-center gap-1 pl-2">
            <CornerDownRight className="size-4 text-muted-foreground" />
            <CounterpartiesSelect
              accountId={transaction.fromAccount}
              value={transaction.fromCounterparty}
              onValueChange={(counterparty) =>
                handleTransactionUpdate(transaction, {
                  fromCounterparty: counterparty,
                })
              }
            />
          </div>
        )}
        {fromAccount?.type === AccountType.ASSETS && (
          <div className="flex items-center gap-1 pl-2">
            <CornerDownRight className="size-4 text-muted-foreground" />
            <AssetSelect
              accountId={transaction.fromAccount}
              value={transaction.fromAsset}
              onValueChange={(asset) =>
                handleTransactionUpdate(transaction, {
                  fromAsset: asset,
                })
              }
            />
          </div>
        )}
      </div>
      <div className="mx-3 py-2 text-center">
        <MoveRight className="size-4" />
      </div>
      <div className="flex flex-col gap-2">
        <AccountSelect
          value={transaction.toAccount}
          onChange={(account) =>
            handleTransactionUpdate(transaction, {
              toAccount: account,
              toCounterparty: null,
              toAsset: null,
            })
          }
        />
        {toAccount?.type === AccountType.LIABILITIES && (
          <div className="flex items-center gap-1 pl-2">
            <CornerDownRight className="size-4 text-muted-foreground" />
            <CounterpartiesSelect
              accountId={transaction.toAccount}
              value={transaction.toCounterparty}
              onValueChange={(counterparty) =>
                handleTransactionUpdate(transaction, {
                  toCounterparty: counterparty,
                })
              }
            />
          </div>
        )}
        {toAccount?.type === AccountType.ASSETS && (
          <div className="flex items-center gap-1 pl-2">
            <CornerDownRight className="size-4 text-muted-foreground" />
            <AssetSelect
              accountId={transaction.toAccount}
              value={transaction.toAsset}
              onValueChange={(asset) =>
                handleTransactionUpdate(transaction, {
                  toAsset: asset,
                })
              }
            />
          </div>
        )}
      </div>

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
  );
}
