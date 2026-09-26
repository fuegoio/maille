import { ACCOUNT_TYPES, AccountType } from "@maille/core/accounts";
import { Link } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

import {
  ledgerAmountClassName,
  ledgerHeaderClassName,
  ledgerRowClassName,
} from "@/components/shared/ledger-table";
import { Button } from "@/components/ui/button";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { getAccountBalanceAtDate } from "@/logic/accounts";
import { getAssetsAccountEstimation } from "@/logic/assets";
import { endOfToday, getAccountEstimation } from "@/logic/investments";
import {
  useAccounts,
  ACCOUNT_TYPES_COLOR,
  ACCOUNT_TYPES_NAME,
} from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAssets } from "@/stores/assets";
import { useAuth } from "@/stores/auth";
import { useInvestments } from "@/stores/investments";

import { Badge } from "../ui/badge";

export function AccountsTable() {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const assets = useAssets((state) => state.assets);
  const assetValuations = useAssets((state) => state.assetValuations);
  const investments = useInvestments((state) => state.investments);
  const investmentPrices = useInvestments((state) => state.investmentPrices);
  const user = useAuth((state) => state.user!);

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

  const currencyFormatter = useCurrencyFormatter();

  // Balances stop at today: future activities are previsions, not money
  // that has landed yet
  const today = startOfDay(new Date());

  const getAccountTotal = (accountId: string) =>
    getAccountBalanceAtDate({
      accountId,
      activities,
      accounts,
      startingDate: user.startingDate,
      date: today,
    });

  // The estimation reads the valuation layer: priced positions for
  // investment accounts, valued assets for assets accounts. Other
  // account types hold no estimation: their balance is their value.
  const estimationAt = new Date(endOfToday());
  const getAccountEstimationFor = (accountId: string, type: AccountType) =>
    type === AccountType.INVESTMENT_ACCOUNT
      ? getAccountEstimation(
          investments,
          activities,
          investmentPrices,
          accountId,
          estimationAt,
        )
      : type === AccountType.ASSETS
        ? getAssetsAccountEstimation(
            assets,
            assetValuations,
            accountId,
            estimationAt,
          )
        : null;

  const getAccountTypeTotal = (accountType: AccountType) => {
    return accounts
      .filter((account) => account.type === accountType)
      .reduce((acc, account) => {
        return acc + getAccountTotal(account.id);
      }, 0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {ACCOUNT_TYPES.map((accountType) => (
        <div key={accountType}>
          <div
            className={cn(
              ledgerHeaderClassName,
              // The strip's responsive padding, so the type totals stay
              // over the rows' balance column at every width
              "flex h-9 shrink-0 items-center gap-2 px-4 sm:px-6",
            )}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`${groupsFolded.includes(accountType) ? "Expand" : "Collapse"} ${ACCOUNT_TYPES_NAME[accountType]}`}
              aria-expanded={!groupsFolded.includes(accountType)}
              className="mr-1 -ml-1 text-muted-foreground"
              onClick={() => {
                if (groupsFolded.includes(accountType)) {
                  setGroupsFolded((prev) =>
                    prev.filter((id) => id !== accountType),
                  );
                } else {
                  setGroupsFolded((prev) => [...prev, accountType]);
                }
              }}
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform duration-100 motion-reduce:transition-none",
                  groupsFolded.includes(accountType) && "-rotate-90",
                )}
              />
            </Button>

            <div
              className={cn(
                "mr-2 h-3 w-3 shrink-0 rounded-xl",
                ACCOUNT_TYPES_COLOR[accountType],
              )}
            />
            <div>{ACCOUNT_TYPES_NAME[accountType]}</div>
            <div className="flex-1" />

            <div
              className={cn(
                ledgerAmountClassName,
                "hidden w-32 pl-4 text-xs text-muted-foreground sm:block",
              )}
            >
              {(() => {
                if (
                  accountType !== AccountType.INVESTMENT_ACCOUNT &&
                  accountType !== AccountType.ASSETS
                ) {
                  return "";
                }
                // No account holds an estimation: the cell stays
                // empty. Absence, never a zero.
                const estimations = accounts
                  .filter((account) => account.type === accountType)
                  .map((account) =>
                    getAccountEstimationFor(account.id, accountType),
                  );
                if (estimations.every((estimation) => estimation === null)) {
                  return "";
                }
                return currencyFormatter.format(
                  estimations.reduce(
                    (total, estimation) => total + (estimation?.value ?? 0),
                    0,
                  ),
                );
              })()}
            </div>
            <div className={cn(ledgerAmountClassName, "w-32 pl-4 text-xs")}>
              {currencyFormatter.format(getAccountTypeTotal(accountType))}
            </div>
          </div>

          {!groupsFolded.includes(accountType) &&
            sortedAccounts
              .filter((account) => account.type === accountType)
              .map((account) => (
                <Link
                  key={account.id}
                  to="/accounts/$id"
                  params={{ id: account.id }}
                  className={cn(
                    ledgerRowClassName,
                    // The strip's responsive right padding, so the
                    // transactions count and balance stay under their
                    // headers at every width
                    "group flex h-10 w-full items-center border-b pr-4 pl-14 sm:pr-6",
                  )}
                >
                  <div className="text-sm font-medium whitespace-nowrap">
                    {account.name}
                  </div>
                  {account.default && (
                    <Badge variant="outline" className="ml-4">
                      Default
                    </Badge>
                  )}
                  {account.sharing.length > 0 && (
                    <Badge variant="default" className="ml-4">
                      Shared
                    </Badge>
                  )}

                  <div className="flex-1" />
                  <div className="mr-4 text-sm text-muted-foreground">
                    {getTransactionsLinkedToAccount(account.id)} transactions
                  </div>

                  <div
                    className={cn(
                      ledgerAmountClassName,
                      "hidden w-32 text-sm text-muted-foreground sm:block",
                    )}
                  >
                    {(() => {
                      const estimation = getAccountEstimationFor(
                        account.id,
                        account.type,
                      );
                      return estimation === null
                        ? ""
                        : currencyFormatter.format(estimation.value);
                    })()}
                  </div>
                  <div className={cn(ledgerAmountClassName, "w-32 text-sm")}>
                    {currencyFormatter.format(getAccountTotal(account.id))}
                  </div>
                </Link>
              ))}
        </div>
      ))}
    </div>
  );
}
