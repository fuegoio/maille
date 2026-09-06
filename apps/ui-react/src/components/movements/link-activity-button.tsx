import type { Activity } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";

import { getActivityTransactionsSumByAccount } from "@maille/core/activities";
import _ from "lodash";
import { Euro, Link } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { searchCompare } from "@/lib/strings";
import { createMovementActivityMutation } from "@/mutations/movements";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useSync } from "@/stores/sync";

interface LinkActivityButtonProps {
  movement: Movement;
  className?: string;
}

export function LinkActivityButton({
  movement,
  className,
}: LinkActivityButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterAmount, setFilterAmount] = React.useState(true);

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      setSearch("");
      setFilterAmount(true);
    }
  };

  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const currencyFormatter = useCurrencyFormatter();

  const getAccountSum = React.useCallback(
    (activity: Activity) => {
      const transactionsSumByAccount = getActivityTransactionsSumByAccount(
        activity.transactions,
        accounts,
      );
      return transactionsSumByAccount.find(
        (tba) => tba.account === movement.account,
      )?.total;
    },
    [accounts, movement.account],
  );

  const { filteredActivities, hasAmountMatches } = React.useMemo(() => {
    const baseActivities = activities.filter((activity) => {
      if (activity.status === "completed") return false;
      if (activity.movements.some((am) => am.movement === movement.id))
        return false;
      if (
        !activity.transactions.some(
          (t) =>
            t.fromAccount === movement.account ||
            t.toAccount === movement.account,
        )
      )
        return false;
      return true;
    });

    const matchesAmount = (activity: Activity) =>
      _.round(getAccountSum(activity) ?? 0, 2) === _.round(movement.amount, 2);

    const amountMatches = baseActivities.filter(matchesAmount);

    const filtered = _.orderBy(
      baseActivities.filter((activity) => {
        if (filterAmount && !matchesAmount(activity)) return false;

        if (search !== "" && !searchCompare(search, activity.name))
          return false;

        return true;
      }),
      ["date"],
      ["desc"],
    );

    return {
      filteredActivities: filtered,
      hasAmountMatches: amountMatches.length > 0,
    };
  }, [activities, movement, filterAmount, search, getAccountSum]);

  const linkActivity = (activity: Activity) => {
    const newId = crypto.randomUUID();
    mutate({
      name: "createMovementActivity",
      mutation: createMovementActivityMutation,
      variables: {
        id: newId,
        movementId: movement.id,
        activityId: activity.id,
        amount: movement.amount,
      },
      rollbackData: undefined,
      events: [
        {
          type: "createMovementActivity",
          payload: {
            id: newId,
            movement: movement.id,
            activity: activity.id,
            amount: movement.amount,
          },
        },
      ],
    });

    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={className}
            onClick={() => handleOpenChange(true)}
          >
            <Link className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Link an activity</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[400px] flex-col sm:max-w-2xl">
          <DialogHeader>
            <div className="mb-2 flex">
              <div className="flex h-6 items-center rounded bg-muted px-2.5 text-xs font-medium text-foreground">
                {movement.name}
              </div>
            </div>

            <div className="-mr-1 flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for an activity ..."
                className="h-10 min-w-0 flex-1 border-none bg-transparent pl-1 text-left text-lg text-foreground outline-none"
                autoFocus
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`transition ${filterAmount ? "opacity-100" : "opacity-50"}`}
                    onClick={() => setFilterAmount(!filterAmount)}
                  >
                    <Euro />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {filterAmount
                      ? hasAmountMatches
                        ? "Filter by amount (active)"
                        : "No activities match the amount — click to disable filter"
                      : "Filter by amount (disabled)"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex h-8 shrink-0 cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-muted"
                onClick={() => linkActivity(activity)}
              >
                <div className="hidden w-20 shrink-0 text-muted-foreground sm:block">
                  {activity.date.toLocaleDateString("fr-FR")}
                </div>
                <div className="w-10 shrink-0 text-muted-foreground sm:hidden">
                  {activity.date.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </div>

                <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-white">
                  {activity.name}
                </div>
                <div className="flex-1" />
                <div className="w-20 text-right whitespace-nowrap text-white">
                  {currencyFormatter.format(getAccountSum(activity) ?? 0)}
                </div>
              </div>
            ))}

            {filteredActivities.length === 0 && (
              <div className="flex w-full items-center justify-center py-2 text-sm text-muted-foreground">
                No activity waiting for reconciliation found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
