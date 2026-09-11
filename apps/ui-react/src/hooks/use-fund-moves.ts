import { useMemo } from "react";

import { flattenActivityFundMoves } from "@/logic/funds";
import { useActivities } from "@/stores/activities";

/**
 * The fund moves flattened from the activities' transactions: legs live on
 * their transactions — there is no separate fund move collection.
 */
export function useFundMoves() {
  const activities = useActivities((state) => state.activities);
  return useMemo(() => flattenActivityFundMoves(activities), [activities]);
}
