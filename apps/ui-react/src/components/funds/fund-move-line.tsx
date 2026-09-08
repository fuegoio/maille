import type { FundMove } from "@maille/core/funds";

import { format } from "date-fns";
import { MoveRight } from "lucide-react";

import { AccountFlowLabel } from "@/components/funds/account-flow-label";
import { cn } from "@/lib/utils";

/** A fund move as seen from one fund: which activity, which side, how much. */
export type FundMoveWithActivity = FundMove & {
  kind: "move";
  /** Direction of money relative to the fund. */
  direction: "in" | "out";
  /** The activity holding the transaction, when the move is tied to one. */
  activity: { id: string; name: string } | null;
  /** The transaction's account movement, when the move is tied to one. */
  accounts: { from: string; to: string } | null;
};

export function FundMoveLine({
  move,
  funds,
  currencyFormatter,
  onClick,
}: {
  move: FundMoveWithActivity;
  funds: { id: string; name: string; color: string }[];
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

  return (
    <div
      className={cn(
        "group @container flex h-10 shrink-0 border-b border-l-4 border-l-transparent pr-2 pl-5 text-sm transition-colors hover:bg-accent lg:pr-6",
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
