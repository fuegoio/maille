import type { FundAllocation } from "@maille/core/funds";

import { Plus, X } from "lucide-react";
import { useEffect, useMemo } from "react";

import { FundSelect } from "@/components/funds/fund-select";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getUntrackedByAccountAtDate } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";

/**
 * One allocation row under edit: a fund and the amount of the account's
 * initial balance it claims.
 */
export interface AccountAllocationRow {
  id: string;
  fund: string | null;
  amount: number;
}

export const accountAllocationRowsFrom = (
  allocations: FundAllocation[],
  accountId: string,
): AccountAllocationRow[] =>
  allocations
    .filter((allocation) => allocation.account === accountId)
    .map((allocation) => ({
      id: allocation.id,
      fund: allocation.fund,
      amount: allocation.amount,
    }));

/** The rows worth saving: a real fund and a positive amount. */
export const significantAccountAllocationRows = (
  rows: AccountAllocationRow[],
) =>
  rows
    .filter((row) => row.fund !== null && row.amount > 0)
    .map((row) => ({
      id: row.id,
      fund: row.fund as string,
      amount: row.amount,
    }));

interface AccountAllocationsEditorProps {
  /** The account whose initial balance is being split across funds. */
  accountId: string;
  /** Draft starting balance, so the available pool follows the field live. */
  startingBalance: number;
  /** Rows under edit. */
  rows: AccountAllocationRow[];
  onChange: (rows: AccountAllocationRow[]) => void;
  /** Live validation result, so hosts can gate their submit button. */
  onErrorChange?: (error: string | null) => void;
}

export function AccountAllocationsEditor({
  accountId,
  startingBalance,
  rows,
  onChange,
  onErrorChange,
}: AccountAllocationsEditorProps) {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const fundAllocations = useFunds((state) => state.fundAllocations);
  const user = useAuth((state) => state.user);
  const currencyFormatter = useCurrencyFormatter();

  // The initial money no fund claims yet: the account's untracked position
  // at the user's starting date, replayed from the ledger with this
  // account's own allocations excluded (they are the ones being replaced)
  // and the draft starting balance in place, so the pool follows the field.
  const available = useMemo(() => {
    if (!user) return 0;
    return (
      getUntrackedByAccountAtDate({
        accounts: accounts.map((account) =>
          account.id === accountId ? { ...account, startingBalance } : account,
        ),
        activities,
        funds,
        fundMoves,
        fundAllocations: fundAllocations.filter(
          (allocation) => allocation.account !== accountId,
        ),
        date: user.startingDate,
        startingDate: user.startingDate,
      }).get(accountId) ?? 0
    );
  }, [
    user,
    accounts,
    accountId,
    startingBalance,
    activities,
    funds,
    fundMoves,
    fundAllocations,
  ]);

  const assigned = useMemo(
    () =>
      rows.reduce(
        (total, row) =>
          total + (row.fund !== null && row.amount > 0 ? row.amount : 0),
        0,
      ),
    [rows],
  );

  const error = useMemo(() => {
    if (assigned - available > 0.005) {
      return (
        `Allocations exceed the untracked money: ${currencyFormatter.format(assigned)} assigned, ` +
        `${currencyFormatter.format(available)} available`
      );
    }
    return null;
  }, [assigned, available, currencyFormatter]);

  useEffect(() => {
    onErrorChange?.(error);
  }, [error, onErrorChange]);

  const updateRow = (rowId: string, update: Partial<AccountAllocationRow>) => {
    onChange(
      rows.map((row) => (row.id === rowId ? { ...row, ...update } : row)),
    );
  };

  const fundName = (fundId: string) =>
    funds.find((fund) => fund.id === fundId)?.name ?? fundId;

  // Adding a fund claims what is left untracked by default, so assigning the
  // whole initial balance is one click plus picking the fund.
  const addRow = () => {
    const remaining = Math.max(0, available - assigned);
    onChange([
      ...rows,
      { id: crypto.randomUUID(), fund: null, amount: remaining },
    ]);
  };

  return (
    <Field>
      <FieldLabel>Opening allocation</FieldLabel>
      <FieldContent>
        <div className="space-y-2">
          {funds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No fund yet — create one from the Funds page to assign the
              starting balance.
            </p>
          ) : (
            <>
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <FundSelect
                    className="min-w-0 flex-1"
                    value={row.fund}
                    onValueChange={(value) =>
                      updateRow(row.id, { fund: value })
                    }
                    placeholder="Fund"
                    excludeIds={rows
                      .filter(
                        (other) => other.id !== row.id && other.fund !== null,
                      )
                      .map((other) => other.fund as string)}
                  />
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
                    aria-label={`Remove allocation${row.fund ? ` on ${fundName(row.fund)}` : ""}`}
                    onClick={() =>
                      onChange(rows.filter((r) => r.id !== row.id))
                    }
                  >
                    <X />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
              >
                <Plus />
                Add fund
              </Button>

              <div className="pr-10 text-right text-xs text-muted-foreground">
                {currencyFormatter.format(assigned)} of{" "}
                {currencyFormatter.format(available)} assigned
                {available - assigned > 0.005 &&
                  ` · ${currencyFormatter.format(available - assigned)} untracked`}
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </FieldContent>
      <FieldDescription>
        Each fund claims part of the starting balance from its start date; the
        rest stays untracked.
      </FieldDescription>
    </Field>
  );
}
