import type { Transaction } from "@maille/core/activities";
import type { FundMove } from "@maille/core/funds";

import { AccountType } from "@maille/core/accounts";
import {
  ArrowRight,
  CornerDownRight,
  Ellipsis,
  MoveDown,
  MoveRight,
  PiggyBank,
  TrashIcon,
} from "lucide-react";

import { AccountSelect } from "@/components/accounts/account-select";
import { FundSelect } from "@/components/funds/fund-select";
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
import { useFunds } from "@/stores/funds";

import { AssetSelect } from "../accounts/assets/assets-select";
import { CounterpartiesSelect } from "../accounts/counterparties/counterparties-select";

interface TransactionProps {
  transaction: Omit<Transaction, "id">;
  className?: string;
  isStaged?: boolean;
  onUpdate?: (
    updateData: Partial<Transaction> & { fundMoves?: FundMove[] },
  ) => void;
  onDelete?: () => void;
}

export function Transaction({
  transaction,
  className,
  isStaged,
  onUpdate,
  onDelete,
}: TransactionProps) {
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);

  const fromAccount = accounts.find((a) => a.id === transaction.fromAccount);
  const toAccount = accounts.find((a) => a.id === transaction.toAccount);

  // The fund this transaction draws from / feeds into, derived from its legs
  const fromFundMove = transaction.fundMoves?.find((m) => m.fromFund);
  const toFundMove = transaction.fundMoves?.find((m) => m.toFund);
  const trackedFromFund = fromFundMove
    ? funds.find((f) => f.id === fromFundMove.fromFund)
    : undefined;
  const trackedToFund = toFundMove
    ? funds.find((f) => f.id === toFundMove.toFund)
    : undefined;

  // Money leaving a balance account (expense, investment) tracks the source fund;
  // money entering one (revenue, refund) tracks the destination fund
  const isFromBalance =
    fromAccount &&
    ![AccountType.EXPENSE, AccountType.REVENUE].includes(fromAccount.type);
  const isToBalance =
    toAccount &&
    ![AccountType.EXPENSE, AccountType.REVENUE].includes(toAccount.type);
  const trackFromFund = isFromBalance && !isToBalance;
  const trackToFund = !isFromBalance && isToBalance;

  const handleFromFundChange = (fundId: string | null) => {
    // Replace all legs with a single leg on the chosen fund at full amount.
    // The server auto-assigns any remainder to the default fund.
    onUpdate?.({
      fundMoves:
        fundId !== null
          ? [
              {
                id: crypto.randomUUID(),
                fromFund: fundId,
                toFund: null,
                amount: transaction.amount,
                note: null,
                date: new Date(),
                transaction: null,
              },
            ]
          : [],
    });
  };

  const handleToFundChange = (fundId: string | null) => {
    onUpdate?.({
      fundMoves:
        fundId !== null
          ? [
              {
                id: crypto.randomUUID(),
                fromFund: null,
                toFund: fundId,
                amount: transaction.amount,
                note: null,
                date: new Date(),
                transaction: null,
              },
            ]
          : [],
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border bg-muted/30 p-2 py-2 text-sm shadow-md sm:flex-row sm:gap-0",
        isStaged && "border-dashed opacity-70",
        className,
      )}
    >
      <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
        <AccountSelect
          className="w-full sm:w-auto"
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
          <div className="flex items-center gap-2 sm:pl-2">
            <CornerDownRight className="hidden size-4 text-muted-foreground sm:block" />
            <ArrowRight className="size-4 text-muted-foreground sm:hidden" />
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
          <div className="flex items-center gap-2 sm:pl-2">
            <CornerDownRight className="hidden size-4 text-muted-foreground sm:block" />
            <ArrowRight className="size-4 text-muted-foreground sm:hidden" />
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

      <div className="mx-3 text-center sm:py-2">
        <MoveRight className="hidden size-4 sm:block" />
        <MoveDown className="size-4 sm:hidden" />
      </div>

      <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
        <AccountSelect
          className="w-full sm:w-auto"
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
          <div className="flex items-center gap-2 sm:pl-2">
            <CornerDownRight className="hidden size-4 text-muted-foreground sm:block" />
            <ArrowRight className="size-4 text-muted-foreground sm:hidden" />
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
          <div className="flex items-center gap-2 sm:pl-2">
            <CornerDownRight className="hidden size-4 text-muted-foreground sm:block" />
            <ArrowRight className="size-4 text-muted-foreground sm:hidden" />
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

      <div className="hidden flex-1 sm:block" />

      {(trackFromFund || trackToFund) && (
        <div className="flex items-center gap-2">
          <PiggyBank className="size-4 text-muted-foreground" />
          {trackFromFund && (
            <FundSelect
              value={trackedFromFund?.id ?? null}
              onValueChange={handleFromFundChange}
              placeholder="Fund"
              allowEmpty
              emptyLabel="Untracked"
            />
          )}
          {trackToFund && (
            <FundSelect
              value={trackedToFund?.id ?? null}
              onValueChange={handleToFundChange}
              placeholder="Fund"
              allowEmpty
              emptyLabel="Untracked"
            />
          )}
        </div>
      )}

      <div className="flex w-full sm:w-auto">
        <AmountInput
          value={transaction.amount}
          onChange={(amount) => {
            onUpdate?.({
              amount,
            });
          }}
          mode="cell"
          className="mr-2 sm:w-24"
        />

        <div className="flex-1 sm:hidden" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="my-1">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete?.()}
            >
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
