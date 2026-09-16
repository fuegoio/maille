import type { FundMove } from "@maille/core/funds";

import { useMemo } from "react";

import {
  AnalyticsEmpty,
  AnalyticsSection,
} from "@/components/analytics/analytics-section";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import { useFunds } from "@/stores/funds";

/**
 * Fund moves by fund: what flowed into and out of every fund touched by
 * the set's transactions, Untracked included. Null sides are Untracked —
 * money entering or leaving the tracked funds.
 */
export function FundMovesBreakdown({ moves }: { moves: FundMove[] }) {
  const funds = useFunds((state) => state.funds);

  const rows = useMemo(() => {
    const byFund = new Map<string | null, { in: number; out: number }>();
    for (const move of moves) {
      if (move.toFund !== null) {
        const entry = byFund.get(move.toFund) ?? { in: 0, out: 0 };
        entry.in += move.amount;
        byFund.set(move.toFund, entry);
      }
      if (move.fromFund !== null) {
        const entry = byFund.get(move.fromFund) ?? { in: 0, out: 0 };
        entry.out += move.amount;
        byFund.set(move.fromFund, entry);
      }
    }

    return [...byFund.entries()]
      .map(([fundId, entry]) => ({
        fund: funds.find((f) => f.id === fundId) ?? null,
        fundId,
        net: entry.in - entry.out,
        pairs: [
          { dot: "bg-green-400", amount: entry.in },
          { dot: "bg-red-400", amount: -entry.out },
        ],
      }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [moves, funds]);

  if (moves.length === 0 || rows.length === 0) {
    return (
      <AnalyticsSection title="Fund moves">
        <AnalyticsEmpty>No fund move in this view.</AnalyticsEmpty>
      </AnalyticsSection>
    );
  }

  return (
    <AnalyticsSection title="Fund moves">
      <div className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.fundId ?? "untracked"}
            className="flex min-w-0 items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-muted/50"
          >
            <div
              className="size-3 shrink-0 rounded-sm"
              style={
                row.fund
                  ? { backgroundColor: row.fund.color }
                  : {
                      backgroundColor:
                        "color-mix(in srgb, currentColor 40%, transparent)",
                    }
              }
            />
            <div className="min-w-0 truncate text-sm">
              {row.fund ? row.fund.name : "Untracked"}
            </div>
            <AmountPairsValue pairs={row.pairs} className="ml-auto text-sm" />
          </div>
        ))}
      </div>
    </AnalyticsSection>
  );
}
