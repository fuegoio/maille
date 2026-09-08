import type { FundMove } from "@maille/core/funds";

import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, ChevronDown, MoveRight } from "lucide-react";
import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useSearch } from "@/stores/search";

/** A fund move as seen from one fund: which activity, which side, how much. */
type FundMoveWithActivity = FundMove & {
  /** Direction of money relative to the fund. */
  direction: "in" | "out";
  /** The activity holding the transaction, when the move is tied to one. */
  activity: { id: string; name: string } | null;
  /** The transaction's account movement, when the move is tied to one. */
  accounts: { from: string; to: string } | null;
};

interface FundMovesTableProps {
  fundId: string;
}

export function FundMovesTable({ fundId }: FundMovesTableProps) {
  const router = useRouter();
  const currencyFormatter = useCurrencyFormatter();
  const funds = useFunds((state) => state.funds);
  const fundMoves = useFunds((state) => state.fundMoves);
  const activities = useActivities((state) => state.activities);
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
          direction: m.toFund === fundId ? ("in" as const) : ("out" as const),
          activity: info
            ? { id: info.activityId, name: info.activityName }
            : null,
          accounts: info ? { from: info.from, to: info.to } : null,
        };
      })
      .sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) {
          return b.date.getTime() - a.date.getTime();
        }
        return b.id.localeCompare(a.id);
      });
  }, [fundMoves, activities, fundId]);

  const movesFiltered = React.useMemo(
    () =>
      moves.filter((m) => {
        if (!search) return true;
        return m.activity !== null && searchCompare(search, m.activity.name);
      }),
    [moves, search],
  );

  type Group = {
    id: string;
    month: number;
    year: number;
    inflow: number;
    outflow: number;
    moves: FundMoveWithActivity[];
  };

  type MoveAndGroup =
    | ({ itemType: "group" } & Group)
    | ({ itemType: "move" } & FundMoveWithActivity);

  const movesWithGroups = React.useMemo<MoveAndGroup[]>(() => {
    const groups = movesFiltered.reduce((groups: Group[], m) => {
      const month = m.date.getMonth();
      const year = m.date.getFullYear();
      let group = groups.find((p) => p.month === month && p.year === year);

      if (!group) {
        group = {
          id: `${month}-${year}`,
          month,
          year,
          inflow: 0,
          outflow: 0,
          moves: [],
        };
        groups.push(group);
      }

      group.moves.push(m);
      if (m.direction === "in") {
        group.inflow += m.amount;
      } else {
        group.outflow += m.amount;
      }

      return groups;
    }, []);

    return groups
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .reduce((mwg: MoveAndGroup[], group) => {
        mwg.push({
          itemType: "group",
          id: group.id,
          month: group.month,
          year: group.year,
          inflow: group.inflow,
          outflow: group.outflow,
          moves: group.moves,
        });
        if (!groupsFolded.includes(group.id)) {
          return mwg.concat(
            group.moves.map((m) => ({ itemType: "move" as const, ...m })),
          );
        }
        return mwg;
      }, []);
  }, [movesFiltered, groupsFolded]);

  const periodFormatter = (month: number, year: number): string =>
    new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

  if (movesFiltered.length === 0) {
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
          {movesWithGroups.map((item) => (
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
                <FundMoveLine
                  move={item}
                  funds={funds}
                  currencyFormatter={currencyFormatter}
                  onClick={
                    item.activity
                      ? () =>
                          void router.navigate({
                            to: "/activities/$id",
                            params: { id: item.activity!.id },
                            search: item.transaction
                              ? { transaction: item.transaction }
                              : undefined,
                          })
                      : undefined
                  }
                />
              )}
            </React.Fragment>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}

function FundMoveLine({
  move,
  funds,
  currencyFormatter,
  onClick,
}: {
  move: FundMoveWithActivity;
  funds: { id: string; name: string; emoji: string | null }[];
  currencyFormatter: Intl.NumberFormat;
  onClick?: () => void;
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
          {counterpart.emoji && <span>{counterpart.emoji}</span>}
          <span className="max-w-40 truncate text-ellipsis whitespace-nowrap">
            {counterpart.name}
          </span>
        </>
      ) : (
        <span>Untracked</span>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "group @container flex h-10 shrink-0 border-b border-l-4 border-l-transparent pr-2 pl-5 text-sm transition-colors hover:bg-accent",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
    >
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
    </div>
  );
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
