import { Link } from "@tanstack/react-router";
import { startOfDay } from "date-fns";
import { format } from "date-fns";
import { CircleCheck, CircleDotDashed } from "lucide-react";
import { useMemo } from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { ContextLink } from "@/components/navigation/breadcrumbs";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import {
  ledgerHeaderClassName,
  ledgerRowClassName,
} from "@/components/shared/ledger-table";
import { cn } from "@/lib/utils";
import { useMovements } from "@/stores/movements";

const RECENT_COUNT = 8;

/**
 * The latest bank movements: the money that landed on accounts, with
 * their linked status marks, in the shared table vocabulary.
 */
export function RecentMovements() {
  const movements = useMovements((state) => state.movements);

  const recent = useMemo(() => {
    const today = startOfDay(new Date());
    return [...movements]
      .filter((movement) => startOfDay(movement.date) <= today)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, RECENT_COUNT);
  }, [movements]);

  return (
    <section aria-label="Recent movements" className="flex min-w-0 flex-col">
      <div
        className={cn(
          ledgerHeaderClassName,
          "flex h-9 shrink-0 items-center justify-between px-4 lg:px-6",
        )}
      >
        <span>Recent movements</span>
        <Link
          to="/movements"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted-foreground lg:px-6">
          No movements yet.
        </p>
      ) : (
        <div>
          {recent.map((movement) => (
            <ContextLink
              key={movement.id}
              to="/movements/$id"
              params={{ id: movement.id }}
              aria-label={movement.name}
              className={cn(
                ledgerRowClassName,
                "flex h-10 shrink-0 items-center gap-2 border-b pr-2 pl-4 text-sm last:border-b-0 lg:px-6",
              )}
            >
              <div className="w-12 shrink-0 text-muted-foreground">
                {format(movement.date, "dd EEE")}
              </div>

              {movement.status === "incomplete" ? (
                <CircleDotDashed className="size-4 shrink-0 text-warning" />
              ) : (
                <CircleCheck className="size-4 shrink-0 text-primary" />
              )}

              <div className="min-w-0 truncate text-foreground">
                {movement.name}
              </div>

              <div className="hidden min-w-0 truncate text-muted-foreground sm:block">
                · <AccountLabel accountId={movement.account} />
              </div>

              <div className="flex-1" />

              <AmountPairsValue
                pairs={[
                  {
                    dot: movement.amount > 0 ? "bg-green-400" : "bg-red-400",
                    amount: movement.amount,
                  },
                ]}
                hideZeros={false}
              />
            </ContextLink>
          ))}
        </div>
      )}
    </section>
  );
}
