import type { ViewConfig as CustomViewConfig } from "@maille/core/views";

import { verifyTransactionFilter } from "@maille/core/views";
import { CircleCheck, CircleDashed, CircleDotDashed } from "lucide-react";
import * as React from "react";

import {
  ContextLink,
  useContextNavigate,
} from "@/components/navigation/breadcrumbs";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import { EntityContextMenu } from "@/components/shared/entity-actions";
import { GroupMarker } from "@/components/shared/group-marker";
import { LedgerDate } from "@/components/shared/ledger-date";
import { ledgerRowClassName } from "@/components/shared/ledger-table";
import { rowOutlineClasses } from "@/components/shared/row-outline";
import { TableGroupHeader } from "@/components/shared/table-group-header";
import { TransactionsFilters } from "@/components/transactions/filters/transactions-filters";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupedRows } from "@/hooks/use-grouped-rows";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { viewGroupOrder } from "@/lib/view-grouping";
import { sortViewRows } from "@/lib/view-ordering";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import {
  buildTransactionRows,
  transactionCounterpartGroup,
  transactionFundGroup,
  transactionGroupAccessors,
  transactionOrderingAccessors,
  type TransactionRow,
  type TransactionViewFilter,
} from "./transaction-view";
import { useTransactionsEntityActions } from "./transactions-actions";
import { TransactionsSelection } from "./transactions-selection";

interface TransactionsTableProps {
  filter: TransactionViewFilter;
  viewId: string;
  /**
   * A custom view's config; overrides the store-backed view. Pass
   * onConfigChange to make the view's filter bar editable.
   */
  config?: Extract<CustomViewConfig, { resource: "transactions" }>;
  onConfigChange?: (
    config: Extract<CustomViewConfig, { resource: "transactions" }>,
  ) => void;
}

export function TransactionsTable({
  filter,
  viewId,
  config,
  onConfigChange,
}: TransactionsTableProps) {
  const contextNavigate = useContextNavigate();
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);
  const { search } = useViewSearch();
  const storedView = useViews((state) => state.getTransactionView(viewId));
  const view = config ?? storedView;
  const groupAccessors = React.useMemo(
    () => transactionGroupAccessors(accounts, funds),
    [accounts, funds],
  );
  const scrollRef = useScrollRestoration<HTMLDivElement>(
    `transactions:${viewId}`,
  );

  const transactions = React.useMemo(
    () => buildTransactionRows(activities, filter, accounts, funds),
    [activities, filter, accounts, funds],
  );

  const transactionsFiltered = React.useMemo(() => {
    const rowFilters = view.filters ?? [];
    return transactions
      .filter((t) => searchCompare(search, t.activity.name))
      .filter((t) => {
        if (rowFilters.length === 0) return true;
        return rowFilters
          .map((rowFilter) =>
            verifyTransactionFilter(rowFilter, {
              date: t.date,
              amount: t.amount,
              direction: t.direction,
              status: t.activity.status,
            }),
          )
          .every((matched) => matched);
      });
  }, [transactions, search, view.filters]);

  const transactionsSorted = React.useMemo(
    () =>
      sortViewRows(
        transactionsFiltered,
        view.ordering,
        transactionOrderingAccessors,
      ),
    [transactionsFiltered, view.ordering],
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
    filter,
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
      {config !== undefined && onConfigChange !== undefined && (
        <TransactionsFilters
          filters={config.filters}
          onFiltersChange={(filters) => onConfigChange({ ...config, filters })}
        />
      )}

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
        filter={filter}
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
  transaction: TransactionRow;
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
  const counterpart = transactionCounterpartGroup(
    transaction.counterpart,
    accounts,
    funds,
  );
  const isInflow = transaction.direction === "in";
  const amount = isInflow ? transaction.amount : -transaction.amount;

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
            {counterpart.marker && <GroupMarker marker={counterpart.marker} />}
            <span className="max-w-40 truncate text-ellipsis whitespace-nowrap">
              {counterpart.label}
            </span>
          </div>
        )}
        {fields.includes("fund") && (
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
            {fund.marker && <GroupMarker marker={fund.marker} />}
            <span className="max-w-32 truncate text-ellipsis whitespace-nowrap">
              {fund.label}
            </span>
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
