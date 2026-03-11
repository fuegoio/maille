import type { Activity } from "@maille/core/activities";
import type { Movement } from "@maille/core/movements";

import { getActivityTransactionsSumByAccount } from "@maille/core/activities";
import _ from "lodash";
import { Euro, Plus } from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
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
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

interface LinkMovementButtonProps {
  activity: Activity;
  account: string;
  className?: string;
}

export function LinkMovementButton({
  activity,
  account,
  className,
}: LinkMovementButtonProps) {
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
  const movements = useMovements((state) => state.movements);
  const accounts = useAccounts((state) => state.accounts);
  const currencyFormatter = useCurrencyFormatter();

  const { filteredMovements, hasAmountMatches } = React.useMemo(() => {
    const transactionsSumByAccount = getActivityTransactionsSumByAccount(
      activity.transactions,
      accounts,
    );
    const transactionsSumOfAccount = transactionsSumByAccount.find(
      (tba) => tba.account === account,
    );

    const baseMovements = movements.filter((m) => {
      if (m.account !== account) return false;
      if (m.status === "completed") return false;
      return true;
    });

    const amountMatches = transactionsSumOfAccount
      ? baseMovements.filter(
          (m) =>
            _.round(m.amount, 2) === _.round(transactionsSumOfAccount.total, 2),
        )
      : baseMovements;

    const filtered = _.orderBy(
      baseMovements.filter((m) => {
        if (
          filterAmount &&
          transactionsSumOfAccount &&
          _.round(m.amount, 2) !== _.round(transactionsSumOfAccount.total, 2)
        )
          return false;

        if (search !== "" && !searchCompare(search, m.name)) return false;

        return true;
      }),
      ["date"],
      ["desc"],
    );

    return {
      filteredMovements: filtered,
      hasAmountMatches: amountMatches.length > 0,
    };
  }, [
    movements,
    accounts,
    activity.transactions,
    account,
    filterAmount,
    search,
  ]);

  const linkMovement = async (movement: Movement) => {
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

  const openDialog = () => {
    setDialogOpen(true);
    setSearch("");
    setFilterAmount(true);
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
            onClick={openDialog}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Link a movement</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[400px] flex-col sm:max-w-2xl">
          <DialogHeader>
            <div className="mb-2 flex">
              <div className="flex h-6 items-center rounded bg-muted px-2.5 text-xs font-medium text-foreground">
                {activity.name}
              </div>
            </div>

            <div className="-mr-1 flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a movement ..."
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
                        : "No movements match the amount — click to disable filter"
                      : "Filter by amount (disabled)"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex h-8 shrink-0 cursor-pointer items-center rounded px-2 py-1 text-sm hover:bg-muted"
                onClick={() => linkMovement(movement)}
              >
                <div className="hidden w-20 shrink-0 text-muted-foreground sm:block">
                  {movement.date.toLocaleDateString("fr-FR")}
                </div>
                <div className="w-10 shrink-0 text-muted-foreground sm:hidden">
                  {movement.date.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </div>

                <AccountLabel accountId={movement.account} />
                <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-white">
                  {movement.name}
                </div>
                <div className="flex-1" />
                <div className="w-20 text-right whitespace-nowrap text-white">
                  {currencyFormatter.format(movement.amount)}
                </div>
              </div>
            ))}

            {filteredMovements.length === 0 && (
              <div className="flex w-full items-center justify-center py-2 text-sm text-muted-foreground">
                No movement waiting for reconciliation found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
