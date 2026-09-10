import type { FundMove } from "@maille/core/funds";

import { getAllocationDate } from "@maille/core/funds";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, ChevronDown, MoveRight } from "lucide-react";
import * as React from "react";

import { EntityContextMenu } from "@/components/shared/entity-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useRangeSelection } from "@/hooks/use-range-selection";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";
import { useSearch } from "@/stores/search";

import { useFundMovesEntityActions } from "./fund-moves-actions";
import { FundMovesSelection } from "./fund-moves-selection";

/** A fund move as seen from one fund: which activity, which side, how much. */
type FundMoveWithActivity = FundMove & {
  kind: "move";
  /** Direction of money relative to the fund. */
  direction: "in" | "out";
  /** The activity holding the transaction, when the move is tied to one. */
  activity: { id: string; name: string } | null;
  /** The transaction's account movement, when the move is tied to one. */
  accounts: { from: string; to: string } | null;
};

/**
 * An opening allocation as seen from one fund: money earmarked out of
 * Untracked at the fund's start, sitting on one account.
 */
type AllocationWithDirection = {
  kind: "allocation";
  id: string;
  date: Date;
  amount: number;
  direction: "in" | "out";
  /** The fund the allocation claims money for. */
  fundId: string;
  /** The account the earmarked money sits on. */
  account: string;
};

type FundRow = FundMoveWithActivity | AllocationWithDirection;

interface FundMovesTableProps {
  /** The fund whose moves to show; null is Untracked (the null side of moves). */
  fundId: string | null;
}

export function FundMovesTable({ fundId }: FundMovesTableProps) {
  const currencyFormatter = useCurrencyFormatter();
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const fundAllocations = useFunds((state) => state.fundAllocations);
  const activities = useActivities((state) => state.activities);
  const user = useAuth((state) => state.user);
  const search = useSearch((state) => state.search);
  const [groupsFolded, setGroupsFolded] = React.useState<string[]>([]);

  const moves = React.useMemo<FundMoveWithActivity[]>(() => {
    // A move tied to a transaction belongs to the activity holding it
    const transactionsById = new Map<
      string,
      { activityId: string; activityName: string; from: string; to: string }
    >();
    for (const activity of activities) {
      for (const transaction of activity.transactions) {
        transactionsById.set(transaction.id, {
          activityId: activity.id,
          activityName: activity.name,
          from: transaction.fromAccount,
          to: transaction.toAccount,
        });
      }
    }

    return fundMoves
      .filter((m) => m.fromFund === fundId || m.toFund === fundId)
      .map((m) => {
        const info = m.transaction
          ? transactionsById.get(m.transaction)
          : undefined;

        return {
          ...m,
          kind: "move" as const,
          direction: m.toFund === fundId ? ("in" as const) : ("out" as const),
          activity: info
            ? { id: info.activityId, name: info.activityName }
            : null,
          accounts: info ? { from: info.from, to: info.to } : null,
        };
      });
  }, [fundMoves, activities, fundId]);

  // Opening allocations: an inflow on the fund's own page, and on the
  // Untracked page the mirror outflow into every fund.
  const allocations = React.useMemo<AllocationWithDirection[]>(() => {
    if (!user) return [];
    const fundById = new Map(funds.map((fund) => [fund.id, fund]));
    return fundAllocations
      .filter((allocation) =>
        fundId === null ? true : allocation.fund === fundId,
      )
      .map((allocation) => {
        const fund = fundById.get(allocation.fund);
        return {
          kind: "allocation" as const,
          id: allocation.id,
          date: getAllocationDate(
            fund ?? { startDate: null },
            user.startingDate,
          ),
          amount: allocation.amount,
          direction: fundId === null ? ("out" as const) : ("in" as const),
          fundId: allocation.fund,
          account: allocation.account,
        };
      });
  }, [fundAllocations, funds, fundId, user]);

  const rows = React.useMemo<FundRow[]>(() => {
    const all: FundRow[] = [...moves, ...allocations];
    return all.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [moves, allocations]);

  const rowsFiltered = React.useMemo(
    () =>
      rows.filter((row) => {
        if (!search) return true;
        // Opening allocations carry no activity to match on
        if (row.kind === "allocation") return false;
        return (
          row.activity !== null && searchCompare(search, row.activity.name)
        );
      }),
    [rows, search],
  );

  type Group = {
    id: string;
    month: number;
    year: number;
    inflow: number;
    outflow: number;
    rows: FundRow[];
  };

  type RowAndGroup =
    | ({ itemType: "group" } & Group)
    | ({ itemType: "row" } & FundRow);

  const rowsWithGroups = React.useMemo<RowAndGroup[]>(() => {
    const groups = rowsFiltered.reduce((groups: Group[], row) => {
      const month = row.date.getMonth();
      const year = row.date.getFullYear();
      let group = groups.find((p) => p.month === month && p.year === year);

      if (!group) {
        group = {
          id: `${month}-${year}`,
          month,
          year,
          inflow: 0,
          outflow: 0,
          rows: [],
        };
        groups.push(group);
      }

      group.rows.push(row);
      if (row.direction === "in") {
        group.inflow += row.amount;
      } else {
        group.outflow += row.amount;
      }

      return groups;
    }, []);

    return groups
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .reduce((rwg: RowAndGroup[], group) => {
        rwg.push({
          itemType: "group",
          id: group.id,
          month: group.month,
          year: group.year,
          inflow: group.inflow,
          outflow: group.outflow,
          rows: group.rows,
        });
        if (!groupsFolded.includes(group.id)) {
          return rwg.concat(
            group.rows.map((row) => ({ itemType: "row" as const, ...row })),
          );
        }
        return rwg;
      }, []);
  }, [rowsFiltered, groupsFolded]);

  // Rendered row order, skipping group headers and unselectable
  // allocation rows, shared by range selection
  const visibleFundMoveIds = React.useMemo(
    () =>
      rowsWithGroups
        .filter((item) => item.itemType === "row" && item.kind === "move")
        .map((item) => item.id),
    [rowsWithGroups],
  );

  const {
    selectedIds: selectedFundMoves,
    toggle: toggleFundMove,
    selectOnly: selectOnlyFundMove,
    selectAll: selectAllFundMoves,
    clear: clearSelectedFundMoves,
  } = useRangeSelection(visibleFundMoveIds);

  const entityActions = useFundMovesEntityActions(
    selectedFundMoves,
    clearSelectedFundMoves,
  );

  useHotkey(
    "Escape",
    () => {
      if (selectedFundMoves.length > 0) {
        clearSelectedFundMoves();
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
      selectAllFundMoves(moves.map((m) => m.id));
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
        <ScrollArea className="flex-1 pb-40">
          {rowsWithGroups.map((item) => (
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
              ) : item.kind === "allocation" ? (
                <AllocationLine
                  allocation={item}
                  funds={funds}
                  currencyFormatter={currencyFormatter}
                />
              ) : (
                <EntityContextMenu
                  actions={entityActions}
                  onActionComplete={clearSelectedFundMoves}
                >
                  <div
                    onContextMenu={() => {
                      if (!selectedFundMoves.includes(item.id)) {
                        selectOnlyFundMove(item.id);
                      }
                    }}
                  >
                    <FundMoveLine
                      move={item}
                      funds={funds}
                      currencyFormatter={currencyFormatter}
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

/** An opening allocation row: earmarked money moving out of Untracked. */
function AllocationLine({
  allocation,
  funds,
  currencyFormatter,
}: {
  allocation: AllocationWithDirection;
  funds: { id: string; name: string; color: string }[];
  currencyFormatter: Intl.NumberFormat;
}) {
  const isInflow = allocation.direction === "in";
  const amount = isInflow ? allocation.amount : -allocation.amount;

  // The other side of an allocation is always Untracked; the account tells
  // where the earmarked money sits.
  const fund = funds.find((f) => f.id === allocation.fundId);

  return (
    <div className="group @container flex h-10 shrink-0 border-b pr-2 pl-5 text-sm transition-colors hover:bg-accent">
      <div className="flex h-10 min-w-0 flex-1 items-center gap-2">
        <div
          className={cn(
            "size-2 shrink-0 rounded-lg",
            isInflow ? "bg-green-400" : "bg-red-400",
          )}
        />

        <div className="mx-1 hidden w-12 shrink-0 text-muted-foreground lg:block">
          {format(allocation.date, "dd EEE")}
        </div>
        <div className="ml-2 w-8 shrink-0 text-muted-foreground lg:hidden">
          {format(allocation.date, "dd EEEEE")}
        </div>

        <div className="flex min-w-0 items-center gap-1.5 font-medium">
          <span className="text-muted-foreground">
            {isInflow ? "from" : "to"}
          </span>
          {isInflow ? (
            <span>Untracked</span>
          ) : fund ? (
            <>
              <div
                className="mr-1 size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
              <span className="max-w-40 truncate text-ellipsis whitespace-nowrap">
                {fund.name}
              </span>
            </>
          ) : (
            <span>Untracked</span>
          )}
        </div>
        <div className="min-w-0 truncate font-medium">Opening allocation</div>
        <div className="hidden min-w-0 items-center gap-1.5 text-muted-foreground md:flex">
          <AccountFlowLabel accountId={allocation.account} />
        </div>
      </div>

      <div className="mr-1 flex h-10 w-32 shrink-0 items-center justify-end font-mono whitespace-nowrap">
        {currencyFormatter.format(amount)}
      </div>
    </div>
  );
}

function FundMoveLine({
  move,
  funds,
  currencyFormatter,
  to,
  params,
  search,
  checked,
  onCheckedChange,
}: {
  move: FundMoveWithActivity;
  funds: { id: string; name: string; color: string }[];
  currencyFormatter: Intl.NumberFormat;
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  checked: boolean;
  onCheckedChange: (event?: React.MouseEvent) => void;
}) {
  const isInflow = move.direction === "in";
  const amount = isInflow ? move.amount : -move.amount;

  // The fund on the other side of the move, when one is tracked
  const counterpartId = isInflow ? move.fromFund : move.toFund;
  const counterpart = funds.find((f) => f.id === counterpartId);

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
    "group @container flex h-10 shrink-0 items-center border-b pr-2 pl-5 text-sm transition-colors hover:bg-accent lg:pr-6",
    checked && "bg-primary/30 hover:bg-primary/40",
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
        <div
          className={cn(
            "size-2 shrink-0 rounded-lg",
            isInflow ? "bg-green-400" : "bg-red-400",
          )}
        />

        <div className="mx-1 hidden w-12 shrink-0 text-muted-foreground lg:block">
          {format(move.date, "dd EEE")}
        </div>
        <div className="ml-2 w-8 shrink-0 text-muted-foreground lg:hidden">
          {format(move.date, "dd EEEEE")}
        </div>

        {move.activity ? (
          <>
            <Link
              to={to as never}
              params={params as never}
              search={search as never}
              className="flex min-w-0 flex-1 items-center gap-2 truncate"
            >
              <div className="min-w-0 truncate font-medium">
                {move.activity.name}
              </div>
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
              <div className="flex-1" />

              {/* The transaction's account movement, when the row is wide */}
              {move.accounts && (
                <div className="hidden shrink-0 items-center gap-1.5 text-muted-foreground @3xl:flex">
                  <AccountFlowLabel accountId={move.accounts.from} />
                  <MoveRight className="size-3.5 shrink-0" />
                  <AccountFlowLabel accountId={move.accounts.to} />
                </div>
              )}
            </Link>
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1.5 font-medium">
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

      <div className="mr-1 flex h-10 w-32 shrink-0 items-center justify-end font-mono whitespace-nowrap">
        {currencyFormatter.format(amount)}
      </div>
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
