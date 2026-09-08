import { format } from "date-fns";

import { AccountFlowLabel } from "@/components/funds/account-flow-label";
import { cn } from "@/lib/utils";

/**
 * An opening allocation as seen from one fund: money earmarked out of
 * Untracked at the fund's start, sitting on one account.
 */
export type AllocationWithDirection = {
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

/** An opening allocation row: earmarked money moving out of Untracked. */
export function AllocationLine({
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
    <div className="group @container flex h-10 shrink-0 border-b border-l-4 border-l-transparent pr-2 pl-5 text-sm transition-colors hover:bg-accent">
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
