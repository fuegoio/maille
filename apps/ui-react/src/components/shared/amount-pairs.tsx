import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";

export interface AmountPair {
  /** The dot's background class, carrying the pair's type or direction. */
  dot: string;
  amount: number;
}

/**
 * Dot + amount pairs — the shared amount vocabulary of every table: the
 * type's color rides on the dot, the amount stays in the foreground color.
 * Zero amounts are omitted unless told otherwise; pairs wrap when narrow.
 */
export function AmountPairsValue({
  pairs,
  className,
  hideZeros = true,
}: {
  pairs: AmountPair[];
  className?: string;
  /** Rows carry their amount even at zero; totals stay quiet. */
  hideZeros?: boolean;
}) {
  const currencyFormatter = useCurrencyFormatter();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-x-4 gap-y-0.5 font-mono font-medium whitespace-nowrap",
        className,
      )}
    >
      {(hideZeros ? pairs.filter((pair) => pair.amount !== 0) : pairs).map(
        (pair, index) => (
          <div key={index} className="flex items-center tabular-nums">
            <div
              className={cn(
                "mr-1.5 size-[0.625em] shrink-0 rounded-full",
                pair.dot,
              )}
            />
            {currencyFormatter.format(pair.amount)}
          </div>
        ),
      )}
    </div>
  );
}
