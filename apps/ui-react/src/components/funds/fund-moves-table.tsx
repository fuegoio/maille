import { format } from "date-fns";
import { MoveRight } from "lucide-react";
import * as React from "react";

import {
  ContextLink,
  useContextNavigate,
} from "@/components/navigation/breadcrumbs";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import { EntityContextMenu } from "@/components/shared/entity-actions";
import { ledgerRowClassName } from "@/components/shared/ledger-table";
import { rowOutlineClasses } from "@/components/shared/row-outline";
import { TableGroupHeader } from "@/components/shared/table-group-header";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupedRows } from "@/hooks/use-grouped-rows";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { getFundMovesRows, type FundMoveRow } from "@/logic/funds";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useViewSearch } from "@/stores/search";

import { useFundMovesEntityActions } from "./fund-moves-actions";
import { FundMovesSelection } from "./fund-moves-selection";

/** A fund move as seen from one fund: which activity, which side, how much. */
type FundMoveWithActivity = FundMoveRow & {
  kind: "move";
};

interface FundMovesTableProps {
  /** The fund whose moves to show; null is Untracked (the null side of moves). */
  fundId: string | null;
  /** Only show moves whose transaction touches this account. */
  accountFilter?: string | null;
  /** Show the whole subtree's moves, not just this fund's own. */
  subtree?: boolean;
}

export function FundMovesTable({
  fundId,
  accountFilter = null,
  subtree = false,
}: FundMovesTableProps) {
  const contextNavigate = useContextNavigate();
  const funds = useFunds((state) => state.funds);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const { search } = useViewSearch();

  const moves = React.useMemo<FundMoveWithActivity[]>(
    () =>
      getFundMovesRows({ activities, accounts, funds, fundId, subtree }).map(
        (move) => ({ ...move, kind: "move" as const }),
      ),
    [activities, accounts, funds, fundId, subtree],
  );

  const rows = React.useMemo<FundMoveWithActivity[]>(
    () =>
      [...moves].sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) {
          return b.date.getTime() - a.date.getTime();
        }
        return b.id.localeCompare(a.id);
      }),
    [moves],
  );

  const rowsFiltered = React.useMemo(
    () =>
      rows.filter((row) => {
        if (accountFilter !== null) {
          if (
            !row.accounts ||
            (row.accounts.from !== accountFilter &&
              row.accounts.to !== accountFilter)
          ) {
            return false;
          }
        }
        if (!search) return true;
        return (
          row.activity !== null && searchCompare(search, row.activity.name)
        );
      }),
    [rows, search, accountFilter],
  );

  const { items, isFolded, toggleGroup } = useGroupedRows(rowsFiltered, true);

  const tableRows = React.useMemo<TableRow[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        selectable: item.itemType === "row" && item.kind === "move",
      })),
    [items],
  );

  const openMove = (id: string) => {
    const move = moves.find((m) => m.id === id);
    if (!move?.activity) return;

    void contextNavigate({
      to: "/activities/$id",
      params: { id: move.activity.id },
      search: move.transaction ? { transaction: move.transaction } : undefined,
    });
  };

  const {
    rowOutlines,
    registerRow,
    selectedIds: selectedFundMoves,
    toggle: toggleFundMove,
    selectOnly: selectOnlyFundMove,
    clearSelection: clearSelectedFundMoves,
  } = useTableRows({
    rows: tableRows,
    checkable: true,
    onOpen: openMove,
  });

  const entityActions = useFundMovesEntityActions(
    selectedFundMoves,
    clearSelectedFundMoves,
  );

  if (rowsFiltered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="text-sm text-muted-foreground">No fund move found.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto">
        <ScrollArea className="flex-1">
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
                  <AmountPairsValue
                    pairs={(["in", "out"] as const).map((direction) => ({
                      dot: direction === "in" ? "bg-green-400" : "bg-red-400",
                      amount: item.rows
                        .filter((row) => row.direction === direction)
                        .reduce((sum, row) => sum + row.amount, 0),
                    }))}
                    className="text-sm"
                  />
                </TableGroupHeader>
              ) : (
                <EntityContextMenu
                  actions={entityActions}
                  onActionComplete={clearSelectedFundMoves}
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
                      openMove(item.id);
                    }}
                    onContextMenu={() => {
                      if (!selectedFundMoves.includes(item.id)) {
                        selectOnlyFundMove(item.id);
                      }
                    }}
                  >
                    <FundMoveLine
                      move={item}
                      funds={funds}
                      to={item.activity ? "/activities/$id" : undefined}
                      params={
                        item.activity ? { id: item.activity.id } : undefined
                      }
                      search={
                        item.activity && item.transaction
                          ? { transaction: item.transaction }
                          : undefined
                      }
                      checked={selectedFundMoves.includes(item.id)}
                      outlineSides={rowOutlines.get(item.id)}
                      onCheckedChange={(event) =>
                        toggleFundMove(item.id, event)
                      }
                    />
                  </div>
                </EntityContextMenu>
              )}
            </React.Fragment>
          ))}
        </ScrollArea>
      </div>

      <FundMovesSelection
        selectedFundMoves={selectedFundMoves}
        onClearSelection={clearSelectedFundMoves}
      />
    </div>
  );
}

/** A fund move row, tied to a transaction's activity. */
function FundMoveLine({
  move,
  funds,
  to,
  params,
  search,
  checked,
  outlineSides,
  onCheckedChange,
}: {
  move: FundMoveWithActivity;
  funds: { id: string; name: string; color: string }[];
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  checked: boolean;
  /** Outline sides when the row is checked or focused; absent otherwise. */
  outlineSides?: { top: boolean; bottom: boolean };
  onCheckedChange: (event?: React.MouseEvent) => void;
}) {
  const isInflow = move.direction === "in";
  const amount = isInflow ? move.amount : -move.amount;

  // The fund on the other side of the move, when one is tracked
  const counterpartId = isInflow ? move.fromFund : move.toFund;
  const counterpart = funds.find((f) => f.id === counterpartId);

  // The subfund holding the row in the subtree view, when it is not the
  // page's fund itself
  const own = funds.find((f) => f.id === move.own);

  const renderOwn = () =>
    own ? (
      <div className="flex min-w-0 shrink-0 items-center gap-1">
        <div
          className="size-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: own.color }}
        />
        <span className="max-w-40 truncate text-ellipsis whitespace-nowrap">
          {own.name}
        </span>
      </div>
    ) : null;

  const renderCounterpart = () => (
    <>
      {counterpart ? (
        <>
          <div
            className="mr-1 size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: counterpart.color }}
          />
          <span className="max-w-40 truncate text-ellipsis whitespace-nowrap">
            {counterpart.name}
          </span>
        </>
      ) : (
        <span>Untracked</span>
      )}
    </>
  );

  const className = cn(
    ledgerRowClassName,
    "group @container flex h-10 shrink-0 items-center border-b pr-2 pl-5 text-sm lg:pr-6",
    outlineSides && rowOutlineClasses(outlineSides),
    to && "cursor-pointer",
  );

  const content = (
    <>
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

      <div className="flex h-10 min-w-0 flex-1 items-center gap-2">
        <div className="mx-1 hidden w-12 shrink-0 text-muted-foreground lg:block">
          {format(move.date, "dd EEE")}
        </div>
        <div className="ml-2 w-8 shrink-0 text-muted-foreground lg:hidden">
          {format(move.date, "dd EEEEE")}
        </div>

        {move.activity ? (
          <>
            <ContextLink
              to={to as never}
              params={params as never}
              search={search as never}
              className="flex min-w-0 flex-1 items-center gap-2 truncate"
            >
              <div className="min-w-0 truncate font-medium">
                {move.activity.name}
              </div>
              {own && (
                <div className="hidden min-w-0 items-center gap-1.5 text-muted-foreground md:flex">
                  {renderOwn()}
                </div>
              )}
              <div className="hidden min-w-0 items-center gap-1.5 text-muted-foreground md:flex">
                <span className="text-xs">{isInflow ? "from" : "to"}</span>
                {renderCounterpart()}
              </div>
              {move.note && (
                <div
                  className="hidden min-w-0 truncate text-muted-foreground md:block"
                  title={move.note}
                >
                  {move.note}
                </div>
              )}

              {/* The transaction's account movement, when the row is wide */}
              {move.accounts && (
                <div className="hidden shrink-0 items-center gap-1.5 border-l px-2 text-muted-foreground @3xl:flex">
                  <AccountFlowLabel accountId={move.accounts.from} />
                  <MoveRight className="size-3.5 shrink-0" />
                  <AccountFlowLabel accountId={move.accounts.to} />
                </div>
              )}

              <div className="flex-1" />
            </ContextLink>
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1.5 font-medium">
              {own && renderOwn()}
              <span className="text-muted-foreground">
                {isInflow ? "from" : "to"}
              </span>
              {renderCounterpart()}
            </div>
            {move.note && (
              <div
                className="hidden min-w-0 truncate text-muted-foreground md:block"
                title={move.note}
              >
                {move.note}
              </div>
            )}
            <div className="flex-1" />
          </>
        )}
      </div>

      <AmountPairsValue
        pairs={[{ dot: isInflow ? "bg-green-400" : "bg-red-400", amount }]}
        hideZeros={false}
      />
    </>
  );

  if (to && move.activity) {
    return <div className={className}>{content}</div>;
  }

  return <div className={className}>{content}</div>;
}

/** An account named with its type swatch, as quiet row metadata. */
function AccountFlowLabel({ accountId }: { accountId: string }) {
  const accounts = useAccounts((state) => state.accounts);
  const account = accounts.find((a) => a.id === accountId);

  if (!account) return null;

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div
        className={cn(
          "size-3 shrink-0 rounded-xl",
          ACCOUNT_TYPES_COLOR[account.type],
        )}
      />
      <span className="max-w-32 truncate text-ellipsis whitespace-nowrap">
        {account.name}
      </span>
    </div>
  );
}
