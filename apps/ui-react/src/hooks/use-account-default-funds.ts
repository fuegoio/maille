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

  return React.useMemo(() => {
    if (!startingDate) {
      return new Map<string, string | null>();
    }
    return getDefaultFundByAccount({
      accounts,
      activities,
      funds,
      fundAllocations,
      startingDate,
    });
  }, [accounts, activities, funds, fundAllocations, startingDate]);
}
