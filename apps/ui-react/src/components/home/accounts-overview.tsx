import { AccountType, type Account } from "@maille/core/accounts";
import { Link } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { useMemo } from "react";

import {
  ledgerHeaderClassName,
  ledgerRowClassName,
} from "@/components/shared/ledger-table";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { getAccountBalanceAtDate } from "@/logic/accounts";
import {
  useAccounts,
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
} from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";

/** Balance accounts first, in reading order; the P&L types stay out. */
const OVERVIEW_TYPES = [
  AccountType.BANK_ACCOUNT,
  AccountType.INVESTMENT_ACCOUNT,
  AccountType.CASH,
  AccountType.LIABILITIES,
  AccountType.ASSETS,
] as const;

/**
 * Where the money lives: every balance account with its current balance,
 * grouped by account type with per-type totals.
 */
export function AccountsOverview() {
  const currencyFormatter = useCurrencyFormatter();
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user!);

  const groups = useMemo(() => {
    const today = startOfDay(new Date());
    const byType = new Map<
      AccountType,
      { account: Account; balance: number }[]
    >();

    for (const account of accounts) {
      if (!(OVERVIEW_TYPES as readonly AccountType[]).includes(account.type)) {
        continue;
      }
      const entry = {
        account,
        balance: getAccountBalanceAtDate({
          accountId: account.id,
          activities,
          accounts,
          startingDate: user.startingDate,
          date: today,
        }),
      };
      const list = byType.get(account.type);
      if (list) {
        list.push(entry);
      } else {
        byType.set(account.type, [entry]);
      }
    }

    return OVERVIEW_TYPES.filter((type) => byType.has(type)).map((type) => {
      const entries = byType.get(type)!;
      entries.sort((a, b) => a.account.name.localeCompare(b.account.name));
      return {
        type,
        entries,
        total: entries.reduce((sum, entry) => sum + entry.balance, 0),
      };
    });
  }, [accounts, activities, user.startingDate]);

  return (
    <section aria-label="Accounts" className="flex min-w-0 flex-col">
      <div
        className={cn(
          ledgerHeaderClassName,
          "flex h-9 shrink-0 items-center justify-between px-4 lg:px-6",
        )}
      >
        <span>Accounts</span>
        <Link
          to="/accounts"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none"
        >
          View all
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground lg:px-6">
          No accounts yet.
        </p>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.type} className="min-w-0">
              <div className="flex h-8 items-center gap-2 px-4 text-xs font-medium text-muted-foreground lg:px-6">
                <span
                  className={cn(
                    "h-3 w-3 shrink-0 rounded-xl",
                    ACCOUNT_TYPES_COLOR[group.type],
                  )}
                  aria-hidden
                />
                <span className="truncate">
                  {ACCOUNT_TYPES_NAME[group.type]}
                </span>
                <span className="flex-1" />
                <span className="font-mono tabular-nums">
                  {currencyFormatter.format(group.total)}
                </span>
              </div>

              {group.entries.map(({ account, balance }) => (
                <Link
                  key={account.id}
                  to="/accounts/$id"
                  params={{ id: account.id }}
                  aria-label={`Open ${account.name}`}
                  className={cn(
                    ledgerRowClassName,
                    "flex h-9 shrink-0 items-center gap-2 border-b pr-2 pl-4 text-sm last:border-b-0 lg:px-6",
                  )}
                >
                  <span className="min-w-0 truncate">{account.name}</span>
                  <span className="flex-1" />
                  <span className="font-mono text-sm font-medium tabular-nums">
                    {currencyFormatter.format(balance)}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
