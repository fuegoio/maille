import type { Activity } from "@maille/core/activities";

import { format } from "date-fns";
import { CircleCheck, CircleDashed, CircleDotDashed } from "lucide-react";
import * as React from "react";

import {
  ContextLink,
  useContextNavigate,
} from "@/components/navigation/breadcrumbs";
import { EntityContextMenu } from "@/components/shared/entity-actions";
import { rowOutlineClasses } from "@/components/shared/row-outline";
import { TableGroupHeader } from "@/components/shared/table-group-header";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useGroupedRows } from "@/hooks/use-grouped-rows";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useViewSearch } from "@/stores/search";

import { useTransactionsEntityActions } from "./transactions-actions";
import { TransactionsSelection } from "./transactions-selection";

/** A transaction as seen from one account: which activity, which side, how much. */
type AccountTransaction = {
  id: string;
  /** The activity's date, the one the row groups and sorts by. */
  date: Date;
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
  const contextNavigate = useContextNavigate();
  const currencyFormatter = useCurrencyFormatter();
  const activities = useActivities((state) => state.activities);
  const { search } = useViewSearch();
  const scrollRef = useScrollRestoration<HTMLDivElement>(
    `transactions:${accountId}`,
  );

  const transactions = React.useMemo<AccountTransaction[]>(() => {
    const result: AccountTransaction[] = [];

    for (const activity of activities) {
      for (const transaction of activity.transactions) {
        if (transaction.toAccount === accountId) {
          result.push({
            id: transaction.id,
            date: activity.date,
            activity,
            direction: "in",
            counterpart: transaction.fromAccount,
            amount: transaction.amount,
          });
        } else if (transaction.fromAccount === accountId) {
          result.push({
            id: transaction.id,
            date: activity.date,
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

  const { items, isFolded, toggleGroup } = useGroupedRows(
    transactionsFiltered,
    true,
  );

  const rows = React.useMemo<TableRow[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        selectable: item.itemType === "row",
      })),
    [items],
  );

  const openTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    void contextNavigate({
      to: "/activities/$id",
      params: { id: transaction.activity.id },
      search: { transaction: transaction.id },
    });
  };

  const {
    rowOutlines,
    registerRow,
    selectedIds: selectedTransactions,
    toggle: toggleTransaction,
    selectOnly: selectOnlyTransaction,
    clearSelection: clearSelectedTransactions,
  } = useTableRows({
    rows,
    checkable: true,
    onOpen: openTransaction,
  });

  const entityActions = useTransactionsEntityActions(
    accountId,
    selectedTransactions,
    clearSelectedTransactions,
  );

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
        <ScrollArea className="flex-1" viewportRef={scrollRef}>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              {item.itemType === "group" ? (
                <TableGroupHeader
                  id={item.id}
                  folded={isFolded(item.id)}
                  onToggle={toggleGroup}
                  month={item.month}
                  year={item.year}
                >
                  {(
                    [
                      ["in", "bg-green-400"],
                      ["out", "bg-red-400"],
                    ] as const
                  ).map(([direction, color]) => {
                    const total = item.rows
                      .filter((row) => row.direction === direction)
                      .reduce((sum, row) => sum + row.amount, 0);

                    return total > 0 ? (
                      <div
                        key={direction}
                        className="flex items-center pl-1 text-right font-mono text-sm sm:pl-4"
                      >
                        <div
                          className={cn(
                            "mr-2 size-2.5 shrink-0 rounded-lg sm:mr-3",
                            color,
                          )}
                        />
                        {currencyFormatter.format(total)}
                      </div>
                    ) : null;
                  })}
                </TableGroupHeader>
              ) : (
                <EntityContextMenu
                  actions={entityActions}
                  onActionComplete={clearSelectedTransactions}
                >
                  <div
                    ref={registerRow(item.id)}
                    onClick={(event) => {
                      if (event.defaultPrevented || event.button !== 0) return;
                      if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey
                      )
                        return;
                      // The activity name is its own link (and keeps
                      // modifier-clicks for the browser)
                      if ((event.target as HTMLElement).closest("a")) return;
                      openTransaction(item.id);
                    }}
                    onContextMenu={() => {
                      if (!selectedTransactions.includes(item.id)) {
                        selectOnlyTransaction(item.id);
                      }
                    }}
                  >
                    <TransactionLine
                      transaction={item}
                      currencyFormatter={currencyFormatter}
                      checked={selectedTransactions.includes(item.id)}
                      outlineSides={rowOutlines.get(item.id)}
                      onCheckedChange={(event) =>
                        toggleTransaction(item.id, event)
                      }
                    />
                  </div>
                </EntityContextMenu>
              )}
            </React.Fragment>
          ))}
        </ScrollArea>
      </div>

      <TransactionsSelection
        accountId={accountId}
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
  outlineSides,
  onCheckedChange,
}: {
  transaction: AccountTransaction;
  currencyFormatter: Intl.NumberFormat;
  checked: boolean;
  /** Outline sides when the row is checked or focused; absent otherwise. */
  outlineSides?: { top: boolean; bottom: boolean };
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
        outlineSides && rowOutlineClasses(outlineSides),
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
