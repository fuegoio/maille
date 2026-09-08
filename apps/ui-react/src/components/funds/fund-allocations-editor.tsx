import type { FundAccount } from "@maille/core/funds";

import { AccountType } from "@maille/core/accounts";
import { getAllocationDate } from "@maille/core/funds";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo } from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUntrackedByAccountAtDate } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";

/** One allocation row under edit: an account and the amount claimed on it. */
export interface AllocationRow {
  id: string;
  account: string | null;
  amount: number;
}

export const allocationRowsFromFundAccounts = (
  allocations: FundAccount[],
): AllocationRow[] =>
  allocations.map((allocation) => ({
    id: allocation.id,
    account: allocation.account,
    amount: allocation.amount,
  }));

/** The rows worth saving: a real account and a positive amount. */
export const significantAllocationRows = (rows: AllocationRow[]) =>
  rows
    .filter((row) => row.account !== null && row.amount > 0)
    .map((row) => ({
      id: row.id,
      account: row.account as string,
      amount: row.amount,
    }));

interface FundAccountsEditorProps {
  /** The fund's (draft) start date: allocations land on it, or the user's start. */
  startDate: Date | null;
  /** Rows under edit. */
  rows: AllocationRow[];
  onChange: (rows: AllocationRow[]) => void;
  /** The fund being edited: its own current allocations free up on change. */
  excludeFund?: string | null;
  /** Live validation result, so hosts can gate their submit button. */
  onErrorChange?: (error: string | null) => void;
}

export function FundAccountsEditor({
  startDate,
  rows,
  onChange,
  excludeFund,
  onErrorChange,
}: FundAccountsEditorProps) {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const fundAccounts = useMemo(() => funds.flatMap((f) => f.accounts), [funds]);
  const user = useAuth((state) => state.user);

  // Funds only hold balance-account money, so only those accounts are offered.
  const balanceAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.type !== AccountType.EXPENSE &&
          account.type !== AccountType.REVENUE,
      ),
    [accounts],
  );

  // What each account still has unclaimed at the allocation date, replayed
  // from the ledger — the same check the server runs on save.
  const untrackedByAccount = useMemo(() => {
    if (!user) return new Map<string, number>();
    return getUntrackedByAccountAtDate({
      accounts,
      activities,
      funds,
      fundMoves,
      fundAccounts: excludeFund
        ? fundAccounts.filter((allocation) => allocation.fund !== excludeFund)
        : fundAccounts,
      date: getAllocationDate({ startDate }, user.startingDate),
      startingDate: user.startingDate,
    });
  }, [
    user,
    accounts,
    activities,
    funds,
    fundMoves,
    fundAccounts,
    excludeFund,
    startDate,
  ]);

  const error = useMemo(() => {
    const claimed = new Map<string, number>();
    for (const row of rows) {
      if (!row.account || !(row.amount > 0)) continue;
      claimed.set(row.account, (claimed.get(row.account) ?? 0) + row.amount);
    }
    for (const [accountId, amount] of claimed) {
      const available = untrackedByAccount.get(accountId) ?? 0;
      if (amount - available > 0.005) {
        const account = accounts.find((a) => a.id === accountId);
        return (
          `Allocation on "${account?.name ?? accountId}" exceeds what is available: ` +
          `${amount.toFixed(2)} requested, ${available.toFixed(2)} untracked`
        );
      }
    }
    return null;
  }, [rows, untrackedByAccount, accounts]);

  useEffect(() => {
    onErrorChange?.(error);
  }, [error, onErrorChange]);

  const updateRow = (rowId: string, update: Partial<AllocationRow>) => {
    onChange(
      rows.map((row) => (row.id === rowId ? { ...row, ...update } : row)),
    );
  };

  const accountName = (accountId: string) =>
    accounts.find((account) => account.id === accountId)?.name ?? accountId;

  return (
    <Field>
      <FieldLabel>Opening allocation</FieldLabel>
      <FieldContent>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Select
                  value={row.account ?? undefined}
                  onValueChange={(value) =>
                    updateRow(row.id, { account: value })
                  }
                >
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {balanceAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <AccountLabel accountId={account.id} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AmountInput
                  value={row.amount}
                  onChange={(value) =>
                    updateRow(row.id, { amount: value ?? 0 })
                  }
                  mode="field"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove allocation${row.account ? ` on ${accountName(row.account)}` : ""}`}
                  onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
                >
                  <X />
                </Button>
              </div>
              {row.account && (
                <div className="pr-10 text-right text-xs text-muted-foreground">
                  {(untrackedByAccount.get(row.account) ?? 0).toFixed(2)}{" "}
                  available
                </div>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange([
                ...rows,
                { id: crypto.randomUUID(), account: null, amount: 0 },
              ])
            }
          >
            <Plus />
            Add account
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </FieldContent>
    </Field>
  );
}
