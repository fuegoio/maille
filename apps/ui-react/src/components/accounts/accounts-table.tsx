import { ACCOUNT_TYPES, AccountType } from "@maille/core/accounts";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

import { cn, getCurrencyFormatter } from "@/lib/utils";
import {
  useAccounts,
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
} from "@/stores/accounts";
import { useActivities } from "@/stores/activities";

import { Badge } from "../ui/badge";

export function AccountsTable() {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const navigate = useNavigate();

  const [groupsFolded, setGroupsFolded] = useState<AccountType[]>([]);

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      return b.default ? 1 : a.default ? -1 : 0;
    });
  }, [accounts]);

  const getTransactionsLinkedToAccount = (accountId: string) => {
    return activities
      .flatMap((a) => a.transactions)
      .filter((t) => t.fromAccount === accountId || t.toAccount === accountId)
      .length;
  };

  const currencyFormatter = getCurrencyFormatter();

  const getAccountTotal = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return 0;

    const transactionsTotal = activities
      .flatMap((a) => a.transactions)
      .filter((t) => t.fromAccount === accountId || t.toAccount === accountId)
      .reduce((acc, t) => {
        if (t.fromAccount === accountId) {
          return acc - t.amount;
        } else {
          return acc + t.amount;
        }
      }, 0);

    return (account.startingBalance ?? 0) + transactionsTotal;
  };

  const getAccountTypeTotal = (accountType: AccountType) => {
    return accounts
      .filter((account) => account.type === accountType)
      .reduce((acc, account) => {
        return acc + getAccountTotal(account.id);
      }, 0);
  };

  return ACCOUNT_TYPES.map((accountType) => (
    <div>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 px-6">
        <ChevronDown
          className={cn(
            "mr-3 size-3 opacity-20 transition-all hover:opacity-100",
            groupsFolded.includes(accountType) && "-rotate-90 opacity-100",
          )}
          onClick={() => {
            if (groupsFolded.includes(accountType)) {
              setGroupsFolded((prev) =>
                prev.filter((id) => id !== accountType),
              );
            } else {
              setGroupsFolded((prev) => [...prev, accountType]);
            }
          }}
        />

        <div
          className={cn(
            "mr-2 h-3 w-3 shrink-0 rounded-xl",
            ACCOUNT_TYPES_COLOR[accountType],
          )}
        />
        <div className="text-sm font-medium">
          {ACCOUNT_TYPES_NAME[accountType]}
        </div>
        <div className="flex-1" />

        <div className="pl-4 text-right font-mono text-sm">
          {currencyFormatter.format(getAccountTypeTotal(accountType))}
        </div>
      </div>

      {!groupsFolded.includes(accountType) &&
        sortedAccounts
          .filter((account) => account.type === accountType)
          .map((account) => (
            <div
              key={account.id}
              className="group flex h-10 w-full items-center border-b pr-6 pl-14 hover:bg-muted/50"
              onClick={() => {
                navigate({
                  to: `/accounts/$id`,
                  params: { id: account.id },
                });
              }}
            >
              <div className="text-sm font-medium">{account.name}</div>
              {account.default && (
                <div className="mx-2 text-sm text-muted-foreground">
                  Default
                </div>
              )}
              <Badge className="ml-4" variant="outline">
                {getTransactionsLinkedToAccount(account.id)} transactions
              </Badge>

              <div className="flex-1" />

              <div className="text-right font-mono text-sm">
                {currencyFormatter.format(getAccountTotal(account.id))}
              </div>
            </div>
          ))}
    </div>
  ));
}
