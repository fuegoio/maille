import type { FundMove } from "@maille/core/funds";

import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { MoveRight, PiggyBank } from "lucide-react";
import { useMemo } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";

interface FundMovesTableProps {
  fundId: string;
}

/** A side of a move: the fund it leaves or enters, or "Untracked" when null. */
function FundMoveSide({ fundId }: { fundId: string | null }) {
  const fund = useFunds((state) =>
    fundId ? state.funds.find((f) => f.id === fundId) : undefined,
  );

  if (!fundId || !fund) {
    return <span className="text-muted-foreground">Untracked</span>;
  }

  return (
    <span>
      {fund.emoji && <span className="mr-1">{fund.emoji}</span>}
      {fund.name}
    </span>
  );
}

export function FundMovesTable({ fundId }: FundMovesTableProps) {
  const fundMoves = useFunds((state) => state.fundMoves);
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = useCurrencyFormatter();

  const moves = useMemo(
    () =>
      fundMoves
        .filter((m) => m.fromFund === fundId || m.toFund === fundId)
        .sort((a, b) => {
          if (a.date.getTime() !== b.date.getTime()) {
            return b.date.getTime() - a.date.getTime();
          }
          return b.id.localeCompare(a.id);
        }),
    [fundMoves, fundId],
  );

  // A move tied to a transaction belongs to the activity holding it
  const activityByTransaction = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const activity of activities) {
      for (const transaction of activity.transactions) {
        map.set(transaction.id, { id: activity.id, name: activity.name });
      }
    }
    return map;
  }, [activities]);

  if (moves.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PiggyBank />
            </EmptyMedia>
            <EmptyTitle>No fund moves yet</EmptyTitle>
            <EmptyDescription>
              Money enters this fund when you allocate to it, or when a
              transaction tracks it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {moves.map((move) => (
        <FundMoveLine
          key={move.id}
          move={move}
          fundId={fundId}
          activity={
            move.transaction
              ? activityByTransaction.get(move.transaction)
              : undefined
          }
          currencyFormatter={currencyFormatter}
        />
      ))}
    </div>
  );
}

function FundMoveLine({
  move,
  fundId,
  activity,
  currencyFormatter,
}: {
  move: FundMove;
  fundId: string;
  activity?: { id: string; name: string };
  currencyFormatter: Intl.NumberFormat;
}) {
  const isInflow = move.toFund === fundId;
  const amount = isInflow ? move.amount : -move.amount;

  return (
    <div className="flex h-12 w-full items-center gap-2 border-b pr-6 pl-6 text-sm hover:bg-muted/50">
      <div className="w-24 shrink-0 text-muted-foreground">
        {format(move.date, "dd/MM/yyyy")}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <FundMoveSide fundId={move.fromFund} />
        <MoveRight className="size-4 shrink-0 text-muted-foreground" />
        <FundMoveSide fundId={move.toFund} />
        {move.note && (
          <span
            className="ml-2 truncate text-muted-foreground"
            title={move.note}
          >
            {move.note}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center">
        {activity ? (
          <Link
            to="/activities/$id"
            params={{ id: activity.id }}
            className="truncate text-muted-foreground hover:text-foreground hover:underline"
          >
            {activity.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">Allocation</span>
        )}
      </div>

      <div className="flex w-32 shrink-0 items-center justify-end gap-1.5 font-mono text-sm whitespace-nowrap">
        <span
          className={cn(
            "size-2 shrink-0 rounded-lg",
            isInflow ? "bg-green-400" : "bg-red-400",
          )}
        />
        {currencyFormatter.format(amount)}
      </div>
    </div>
  );
}
