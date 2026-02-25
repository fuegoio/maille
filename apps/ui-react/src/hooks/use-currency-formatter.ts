import * as React from "react";
import { useAuth } from "@/stores/auth";

export function useCurrencyFormatter() {
  const { user } = useAuth();
  
  return React.useMemo(() => {
    const currency = user?.currency ?? "EUR"; // Fallback to EUR if not set
    
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [user?.currency]);
}