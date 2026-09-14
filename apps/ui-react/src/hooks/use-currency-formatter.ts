import * as React from "react";

import { useAuth } from "@/stores/auth";

/**
 * The ledger's currency formatter: exact amounts with two decimals by
 * default, or compact scale ticks ("€100k") for chart axes, where the
 * tooltip carries the precise figure.
 */
export function useCurrencyFormatter(mode?: "compact") {
  const { user } = useAuth();

  return React.useMemo(() => {
    const currency = user?.currency ?? "EUR"; // Fallback to EUR if not set

    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency,
      ...(mode === "compact"
        ? { notation: "compact", maximumFractionDigits: 1 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
  }, [user?.currency, mode]);
}
