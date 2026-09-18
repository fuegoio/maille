import * as React from "react";

import { getDefaultFundByAccount } from "@/logic/funds";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useFunds } from "@/stores/funds";

/**
 * Every account's default fund: the fund holding the largest share of the
 * account's balance, or null when no fund claims any of it. New activity
 * transactions classify into it automatically.
 */
export function useAccountDefaultFunds(): Map<string, string | null> {
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const funds = useFunds((state) => state.funds);
  const fundAllocations = useFunds((state) => state.fundAllocations);
  const startingDate = useAuth((state) => state.user?.startingDate);
  // Session refreshes deserialize startingDate into a new, equal Date
  // instance. Key the memo on its timestamp so those refreshes don't
  // churn the Map identity for every consumer.
  const startingTime = startingDate ? startingDate.getTime() : null;

  return React.useMemo(() => {
    if (!startingTime) {
      return new Map<string, string | null>();
    }
    return getDefaultFundByAccount({
      accounts,
      activities,
      funds,
      fundAllocations,
      startingDate: new Date(startingTime),
    });
  }, [accounts, activities, funds, fundAllocations, startingTime]);
}
