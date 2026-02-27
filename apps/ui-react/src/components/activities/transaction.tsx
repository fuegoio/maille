import { AccountType } from "@maille/core/accounts";
import type { Transaction } from "@maille/core/activities";
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
import { useAccounts } from "@/stores/accounts";

import { AssetSelect } from "../accounts/assets/assets-select";
import { CounterpartiesSelect } from "../accounts/counterparties/counterparties-select";

interface TransactionProps {
  transaction: Omit<Transaction, "id">;
  className?: string;
  onUpdate?: (updateData: Partial<Transaction>) => void;
  onDelete?: () => void;
}

export function Transaction({
  transaction,
  className,
  onUpdate,
  onDelete,
}: TransactionProps) {
  const accounts = useAccounts((state) => state.accounts);

  const fromAccount = accounts.find((a) => a.id === transaction.fromAccount);
  const toAccount = accounts.find((a) => a.id === transaction.toAccount);

  return (
    <div className={cn("flex items-start py-2 text-sm", className)}>
      <div className="flex flex-col gap-2">
        <AccountSelect
          value={transaction.fromAccount}
          onChange={(account) =>
            onUpdate?.({
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
              value={transaction.fromCounterparty || ""}
              onValueChange={(counterparty) =>
                onUpdate?.({
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
              value={transaction.fromAsset || ""}
              onValueChange={(asset) =>
                onUpdate?.({
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
            onUpdate?.({
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
              value={transaction.toCounterparty || ""}
              onValueChange={(counterparty) =>
                onUpdate?.({
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
              value={transaction.toAsset || ""}
              onValueChange={(asset) =>
                onUpdate?.({
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
          onUpdate?.({
            amount,
          });
        }}
        mode="cell"
        className="mr-2 w-24"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" className="my-1">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onClick={() => onDelete?.()}>
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
