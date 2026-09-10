import type { Activity } from "@maille/core/activities";

import { useHotkey } from "@tanstack/react-hotkeys";
import { format } from "date-fns";
import {
  Calendar,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
} from "lucide-react";
import * as React from "react";

import { ContextLink } from "@/components/navigation/breadcrumbs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useRangeSelection } from "@/hooks/use-range-selection";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useSearch } from "@/stores/search";

import { TransactionsSelection } from "./transactions-selection";

/** A transaction as seen from one account: which activity, which side, how much. */
type AccountTransaction = {
  id: string;
  activity: Activity;
  /** Direction of money relative to the account. */
  direction: "in" | "out";
  /** The account on the other side of the leg. */
  counterpart: string;
  amount: number;
};

interface AccountTransactionsTableProps {
  accountId: string;
}

export function AccountTransactionsTable({
  accountId,
}: AccountTransactionsTableProps) {
  const currencyFormatter = useCurrencyFormatter();
  const activities = useActivities((state) => state.activities);
  const search = useSearch((state) => state.search);
  const scrollRef = useScrollRestoration<HTMLDivElement>(
    `transactions:${accountId}`,
  );
  const [groupsFolded, setGroupsFolded] = React.useState<string[]>([]);

  const transactions = React.useMemo<AccountTransaction[]>(() => {
    const result: AccountTransaction[] = [];

    for (const activity of activities) {
      for (const transaction of activity.transactions) {
        if (transaction.toAccount === accountId) {
          result.push({
            id: transaction.id,
            activity,
            direction: "in",
            counterpart: transaction.fromAccount,
            amount: transaction.amount,
          });
        } else if (transaction.fromAccount === accountId) {
          result.push({
            id: transaction.id,
            activity,
            direction: "out",
            counterpart: transaction.toAccount,
            amount: transaction.amount,
          });
        }
      }
    }

    return result.sort((a, b) => {
      if (a.activity.date.getTime() !== b.activity.date.getTime()) {
        return b.activity.date.getTime() - a.activity.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [activities, accountId]);

  const transactionsFiltered = React.useMemo(
    () => transactions.filter((t) => searchCompare(search, t.activity.name)),
    [transactions, search],
  );

  type Group = {
    id: string;
    month: number;
    year: number;
    inflow: number;
    outflow: number;
    transactions: AccountTransaction[];
  };

  type TransactionAndGroup =
    | ({ itemType: "group" } & Group)
    | ({ itemType: "transaction" } & AccountTransaction);

  const transactionsWithGroups = React.useMemo<TransactionAndGroup[]>(() => {
    const groups = transactionsFiltered.reduce((groups: Group[], t) => {
      const month = t.activity.date.getMonth();
      const year = t.activity.date.getFullYear();
      let group = groups.find((p) => p.month === month && p.year === year);

      if (!group) {
        group = {
          id: `${month}-${year}`,
          month,
          year,
          inflow: 0,
          outflow: 0,
          transactions: [],
        };
        groups.push(group);
      }

      group.transactions.push(t);
      if (t.direction === "in") {
        group.inflow += t.amount;
      } else {
        group.outflow += t.amount;
      }

      return groups;
    }, []);

    return groups
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .reduce((twg: TransactionAndGroup[], group) => {
        twg.push({
          itemType: "group",
          id: group.id,
          month: group.month,
          year: group.year,
          inflow: group.inflow,
          outflow: group.outflow,
          transactions: group.transactions,
        });
        if (!groupsFolded.includes(group.id)) {
          return twg.concat(
            group.transactions.map((t) => ({
              itemType: "transaction" as const,
              ...t,
            })),
          );
        }
        return twg;
      }, []);
  }, [transactionsFiltered, groupsFolded]);

  // Rendered row order, skipping group headers, shared by range selection
  const visibleTransactionIds = React.useMemo(
    () =>
      transactionsWithGroups
        .filter((item) => item.itemType === "transaction")
        .map((item) => item.id),
    [transactionsWithGroups],
  );

  const {
    selectedIds: selectedTransactions,
    toggle: toggleTransaction,
    selectAll: selectAllTransactions,
    clear: clearSelectedTransactions,
  } = useRangeSelection(visibleTransactionIds);

  useHotkey(
    "Escape",
    () => {
      if (selectedTransactions.length > 0) {
        clearSelectedTransactions();
      }
    },
    {
      conflictBehavior: "allow",
    },
  );

  useHotkey(
    "Mod+A",
    (event) => {
      if (event.key !== "a") return;
      selectAllTransactions(transactionsFiltered.map((t) => t.id));
    },
    {
      ignoreInputs: true,
    },
  );

  const periodFormatter = (month: number, year: number): string =>
    new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

  if (transactionsFiltered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="text-sm text-muted-foreground">
          No transaction found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto">
        <ScrollArea className="flex-1 pb-40" viewportRef={scrollRef}>
          {transactionsWithGroups.map((item) => (
            <React.Fragment key={item.id}>
              {item.itemType === "group" ? (
                <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 pr-2 pl-5 sm:px-6">
                  <ChevronDown
                    className={cn(
                      "mr-1 size-3 opacity-20 transition-all hover:opacity-100 sm:mr-3",
                      groupsFolded.includes(item.id) &&
                        "-rotate-90 opacity-100",
                    )}
                    onClick={() => {
                      if (groupsFolded.includes(item.id)) {
                        setGroupsFolded((prev) =>
                          prev.filter((id) => id !== item.id),
                        );
                      } else {
                        setGroupsFolded((prev) => [...prev, item.id]);
                      }
                    }}
                  />
                  <Calendar className="hidden size-4 sm:block" />
                  <div className="text-sm">
                    {periodFormatter(item.month, item.year)}
                  </div>
                  <div className="flex-1" />

                  {item.inflow > 0 && (
                    <div className="flex items-center pl-1 text-right font-mono text-sm sm:pl-4">
                      <div className="mr-2 size-2.5 shrink-0 rounded-lg bg-green-400 sm:mr-3" />
                      {currencyFormatter.format(item.inflow)}
                    </div>
                  )}
                  {item.outflow > 0 && (
                    <div className="flex items-center pl-1 text-right font-mono text-sm sm:pl-4">
                      <div className="mr-2 size-2.5 shrink-0 rounded-lg bg-red-400 sm:mr-3" />
                      {currencyFormatter.format(item.outflow)}
                    </div>
                  )}
                </div>
              ) : (
                <TransactionLine
                  transaction={item}
                  currencyFormatter={currencyFormatter}
                  checked={selectedTransactions.includes(item.id)}
                  onCheckedChange={(event) => toggleTransaction(item.id, event)}
                />
              )}
            </React.Fragment>
          ))}
        </ScrollArea>
      </div>

      <TransactionsSelection
        selectedTransactions={selectedTransactions}
        onClearSelection={clearSelectedTransactions}
      />
    </div>
  );
}

function TransactionLine({
  transaction,
  currencyFormatter,
  checked,
  onCheckedChange,
}: {
  transaction: AccountTransaction;
  currencyFormatter: Intl.NumberFormat;
  checked: boolean;
  onCheckedChange: (event?: React.MouseEvent) => void;
}) {
  const accounts = useAccounts((state) => state.accounts);
  const isInflow = transaction.direction === "in";
  const amount = isInflow ? transaction.amount : -transaction.amount;
  const counterpart = accounts.find((a) => a.id === transaction.counterpart);

  const getStatusIcon = () => {
    if (transaction.activity.status === "scheduled") {
      return <CircleDashed className="size-4 shrink-0 text-muted-foreground" />;
    } else if (transaction.activity.status === "incomplete") {
      return <CircleDotDashed className="size-4 shrink-0 text-orange-300" />;
    } else {
      return <CircleCheck className="size-4 shrink-0 text-indigo-300" />;
    }
  };

  return (
    <div
      className={cn(
        "group flex h-10 shrink-0 cursor-pointer items-center gap-2 border-b pr-2 pl-5 text-sm transition-colors hover:bg-accent lg:pr-6",
        checked && "bg-primary/30 hover:bg-primary/40",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(checked) =>
          checked != "indeterminate" && onCheckedChange()
        }
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCheckedChange(e);
        }}
        className={cn(
          "mr-3.5 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:flex",
          checked && "opacity-100",
        )}
      />

      <div
        className={cn(
          "size-2 shrink-0 rounded-lg",
          isInflow ? "bg-green-400" : "bg-red-400",
        )}
      />

      <div className="mx-1 hidden w-12 shrink-0 text-muted-foreground lg:block">
        {format(transaction.activity.date, "dd EEE")}
      </div>
      <div className="ml-2 w-8 shrink-0 text-muted-foreground lg:hidden">
        {format(transaction.activity.date, "dd EEEEE")}
      </div>

      {getStatusIcon()}

      <ContextLink
        to="/activities/$id"
        params={{ id: transaction.activity.id }}
        search={{ transaction: transaction.id }}
        className="flex min-w-0 flex-1 items-center gap-2 truncate"
      >
        <div className="min-w-0 truncate font-medium">
          {transaction.activity.name}
        </div>

        <div className="hidden min-w-0 items-center gap-1.5 text-muted-foreground md:flex">
          <span className="text-xs">{isInflow ? "from" : "to"}</span>
          {counterpart && (
            <>
              <div
                className={cn(
                  "size-3 shrink-0 rounded-xl",
                  ACCOUNT_TYPES_COLOR[counterpart.type],
                )}
              />
              <span className="max-w-40 truncate text-ellipsis whitespace-nowrap">
                {counterpart.name}
              </span>
            </>
          )}
        </div>
      </ContextLink>

      <div className="flex-1" />

      <div className="w-32 shrink-0 text-right font-mono whitespace-nowrap">
        {currencyFormatter.format(amount)}
      </div>
    </div>
  );
}
