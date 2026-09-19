import { RollingNumber } from "@kitlangton/rolling-number/react";
import "@kitlangton/rolling-number/styles.css";
import { useAuth } from "@/stores/auth";

/**
 * A ledger amount that rolls to its new value — the shared animated figure
 * of summaries, KPIs and activity amounts. Formatting matches the currency
 * formatter exactly: the user's currency at two decimals. Typography is
 * inherited, so the host's `font-mono tabular-nums` classes carry the
 * tabular figure rule. Reduced motion settles values without rolling.
 */
export function RollingAmount({
  value,
  className,
  duration = 500,
}: {
  value: number;
  className?: string;
  /** Roll duration in ms; 0 settles instantly. */
  duration?: number;
}) {
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";

  return (
    <RollingNumber
      value={value}
      format={{
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }}
      duration={duration}
      className={className}
    />
  );
}
