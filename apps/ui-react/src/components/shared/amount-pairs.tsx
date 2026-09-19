import { RollingAmount } from "@/components/ui/rolling-amount";
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
 * Zero amounts are omitted unless told otherwise. Pairs always sit on one
 * line — they never shrink, so a narrow row truncates its label instead
 * of stacking the amounts.
 */
export function AmountPairsValue({
  pairs,
  className,
  hideZeros = true,
  animated = false,
}: {
  pairs: AmountPair[];
  className?: string;
  /** Rows carry their amount even at zero; totals stay quiet. */
  hideZeros?: boolean;
  /** Roll amounts to their new value instead of swapping the text — for
   * figures that change in place, not dense table rows. */
  animated?: boolean;
}) {
  const currencyFormatter = useCurrencyFormatter();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-x-2 font-mono font-medium whitespace-nowrap sm:gap-x-4",
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
            {animated ? (
              <RollingAmount value={pair.amount} />
            ) : (
              currencyFormatter.format(pair.amount)
            )}
          </div>
        ),
      )}
    </div>
  );
}
