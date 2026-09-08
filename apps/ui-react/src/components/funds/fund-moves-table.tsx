import { useRouter } from "@tanstack/react-router";
import { Calendar, ChevronDown } from "lucide-react";
import * as React from "react";

import type { FundMoveWithActivity } from "@/components/funds/fund-move-line";

import { FundMoveLine } from "@/components/funds/fund-move-line";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useSearch } from "@/stores/search";

type FundRow = FundMoveWithActivity;

interface FundMovesTableProps {
  /** The fund whose moves to show; null is Untracked (the null side of moves). */
  fundId: string | null;
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
          kind: "move" as const,
          direction: m.toFund === fundId ? ("in" as const) : ("out" as const),
          activity: info
            ? { id: info.activityId, name: info.activityName }
            : null,
          accounts: info ? { from: info.from, to: info.to } : null,
        };
      });
  }, [fundMoves, activities, fundId]);

  const rows = React.useMemo<FundRow[]>(() => {
    return [...moves].sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [moves]);

  const rowsFiltered = React.useMemo(
    () =>
      rows.filter((row) => {
        if (!search) return true;
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
