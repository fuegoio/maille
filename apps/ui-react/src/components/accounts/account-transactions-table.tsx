import { CircleCheck, CircleDashed, CircleDotDashed } from "lucide-react";
import * as React from "react";

import {
  ContextLink,
  useContextNavigate,
} from "@/components/navigation/breadcrumbs";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import { EntityContextMenu } from "@/components/shared/entity-actions";
import { LedgerDate } from "@/components/shared/ledger-date";
import { ledgerRowClassName } from "@/components/shared/ledger-table";
import { rowOutlineClasses } from "@/components/shared/row-outline";
import { TableGroupHeader } from "@/components/shared/table-group-header";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupedRows } from "@/hooks/use-grouped-rows";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { viewGroupOrder } from "@/lib/view-grouping";
import { sortViewRows } from "@/lib/view-ordering";
import { getTransactionSideFund } from "@/logic/funds";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import {
  accountTransactionFunds,
  transactionFundGroup,
  transactionGroupAccessors,
  transactionOrderingAccessors,
  type AccountTransaction,
} from "./transaction-view";
import { useTransactionsEntityActions } from "./transactions-actions";
import { TransactionsSelection } from "./transactions-selection";

interface AccountTransactionsTableProps {
  accountId: string;
  viewId: string;
  /** Keep only transactions holding this fund on the account's side; null is Untracked. */
  fundFilter?: string | null;
}

export function AccountTransactionsTable({
  accountId,
  viewId,
  fundFilter,
}: AccountTransactionsTableProps) {
  const contextNavigate = useContextNavigate();
  const activities = useActivities((state) => state.activities);
  const { search } = useViewSearch();
  const view = useViews((state) => state.getTransactionView(viewId));
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);
  const groupAccessors = React.useMemo(
    () => transactionGroupAccessors(accounts, funds),
    [accounts, funds],
  );
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
            fund: getTransactionSideFund(transaction, accountId),
            fundIds: accountTransactionFunds(transaction, accountId),
            amount: transaction.amount,
          });
        } else if (transaction.fromAccount === accountId) {
          result.push({
            id: transaction.id,
            date: activity.date,
            activity,
            direction: "out",
            counterpart: transaction.toAccount,
            fund: getTransactionSideFund(transaction, accountId),
            fundIds: accountTransactionFunds(transaction, accountId),
            amount: transaction.amount,
          });
        }
      }
    }

    return result;
  }, [activities, accountId]);

  const transactionsFiltered = React.useMemo(
    () => transactions.filter((t) => searchCompare(search, t.activity.name)),
    [transactions, search],
  );

  const transactionsVisible = React.useMemo(
    () =>
      fundFilter === undefined
        ? transactionsFiltered
        : transactionsFiltered.filter((t) => t.fund === fundFilter),
    [transactionsFiltered, fundFilter],
  );

  const transactionsSorted = React.useMemo(
    () =>
      sortViewRows(
        transactionsVisible,
        view.ordering,
        transactionOrderingAccessors,
      ),
    [transactionsVisible, view.ordering],
  );
  const { items, isFolded, toggleGroup } = useGroupedRows(
    transactionsSorted,
    view.grouping,
    groupAccessors,
    viewGroupOrder(view.grouping, view.ordering),
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

  if (transactionsVisible.length === 0) {
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
                  label={item.label}
                  shortLabel={item.shortLabel}
                  calendar={item.calendar}
                  marker={item.marker}
                  parent={item.parent}
                  count={item.rows.length}
                >
                  {view.fields.includes("amount") && (
                    <AmountPairsValue
                      pairs={(["in", "out"] as const).map((direction) => ({
                        dot: direction === "in" ? "bg-green-400" : "bg-red-400",
                        amount: item.rows
                          .filter((row) => row.direction === direction)
                          .reduce((sum, row) => sum + row.amount, 0),
                      }))}
                      className="text-sm"
                    />
                  )}
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
                      fields={view.fields}
                      fullDate={view.grouping !== "period"}
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
  fields,
  fullDate,
  checked,
  outlineSides,
  onCheckedChange,
}: {
  transaction: AccountTransaction;
  fields: readonly string[];
  fullDate: boolean;
  checked: boolean;
  /** Outline sides when the row is checked or focused; absent otherwise. */
  outlineSides?: { top: boolean; bottom: boolean };
  onCheckedChange: (event?: React.MouseEvent) => void;
}) {
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);
  const fund = transactionFundGroup(transaction, funds);
  const isInflow = transaction.direction === "in";
  const amount = isInflow ? transaction.amount : -transaction.amount;
  const counterpart = accounts.find((a) => a.id === transaction.counterpart);

  const getStatusIcon = () => {
    if (transaction.activity.status === "scheduled") {
      return <CircleDashed className="size-4 shrink-0 text-muted-foreground" />;
    } else if (transaction.activity.status === "incomplete") {
      return <CircleDotDashed className="size-4 shrink-0 text-warning" />;
    } else {
      return <CircleCheck className="size-4 shrink-0 text-primary" />;
    }
  };

  return (
    <div
      className={cn(
        ledgerRowClassName,
        "group flex h-10 shrink-0 cursor-pointer items-center gap-2 border-b pr-2 pl-5 text-sm lg:pr-6",
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
          "mr-1.5 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:flex",
          checked && "opacity-100",
        )}
      />

      {fields.includes("date") && (
        <LedgerDate date={transaction.date} full={fullDate} />
      )}

      {fields.includes("status") && getStatusIcon()}

      <ContextLink
        to="/activities/$id"
        params={{ id: transaction.activity.id }}
        search={{ transaction: transaction.id }}
        className="flex min-w-0 flex-1 items-center gap-2 truncate"
      >
        <div className="min-w-0 truncate font-medium">
          {transaction.activity.name}
        </div>

        {fields.includes("counterpart") && (
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
        )}
        {fields.includes("fund") && (
          <span className="hidden max-w-32 truncate text-xs text-muted-foreground md:inline">
            {fund.label}
          </span>
        )}
      </ContextLink>

      {fields.includes("amount") && (
        <AmountPairsValue
          pairs={[{ dot: isInflow ? "bg-green-400" : "bg-red-400", amount }]}
          hideZeros={false}
        />
      )}
    </div>
  );
}
