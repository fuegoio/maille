import * as React from "react";
import { useStore } from "zustand";
import { movementsStore } from "@/stores/movements";
import { accountsStore } from "@/stores/accounts";
import { syncStore } from "@/stores/sync";
import { createMovementActivityMutation } from "@/mutations/movements";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AccountLabel } from "@/components/accounts/account-label";
import { getCurrencyFormatter } from "@/lib/utils";
import { getActivityTransactionsSumByAccount } from "@maille/core/activities";
import { searchCompare } from "@/lib/strings";
import type { Movement } from "@maille/core/movements";
import type { Activity } from "@maille/core/activities";
import type { string } from "crypto";
import _ from "lodash";

interface LinkMovementButtonProps {
  activity: Activity;
  account: string;
  className?: string;
}

export function LinkMovementButton({ activity, account, className }: LinkMovementButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterAmount, setFilterAmount] = React.useState(true);

  const movements = useStore(movementsStore, (state) => state.movements);
  const accounts = useStore(accountsStore, (state) => state.accounts);

  const filteredMovements = React.useMemo(() => {
    const transactionsSumByAccount = getActivityTransactionsSumByAccount(
      activity.transactions,
      accounts,
    );
    const transactionsSumOfAccount = transactionsSumByAccount.find(
      (tba) => tba.account === account,
    );

    return _.orderBy(
      movements.filter((m) => {
        if (m.account !== account) return false;
        else if (m.status === "completed") return false;

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
  }, [movements, accounts, activity.transactions, account, filterAmount, search]);

  const linkMovement = async (movement: Movement) => {
    const movementActivity = movementsStore
      .getState()
      .createMovementActivity(activity.id, movement.id, movement.amount);

    syncStore.getState().sendEvent({
      name: "createMovementActivity",
      mutation: createMovementActivityMutation,
      variables: {
        id: movementActivity.id,
        movementId: movement.id,
        activityId: activity.id,
        amount: movement.amount,
      },
      rollbackData: undefined,
    });

    setDialogOpen(false);
  };

  const openDialog = () => {
    setDialogOpen(true);
  };

  // Auto-disable amount filter if no movements match
  React.useEffect(() => {
    if (filteredMovements.length === 0) {
      setFilterAmount(false);
    }
  }, []);

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[400px] flex-col sm:max-w-2xl">
          <DialogHeader>
            <div className="mb-2 flex">
              <div className="bg-primary-400 flex h-6 items-center rounded px-2.5 text-xs font-medium text-white">
                #{activity.number} - {activity.name}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a movement ..."
                className="h-10 min-w-0 flex-1 border-none bg-transparent pl-1 text-left text-lg text-white outline-none"
                autoFocus
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`transition ${filterAmount ? "text-primary-400" : "text-primary-400"}`}
                onClick={() => setFilterAmount(!filterAmount)}
              >
                <i className="mdi mdi-currency-eur text-base" aria-hidden="true" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto px-3 py-3">
            {filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="hover:bg-primary-600 my-1 flex h-8 shrink-0 cursor-pointer items-center rounded px-2 text-sm"
                onClick={() => linkMovement(movement)}
              >
                <div className="text-primary-100 hidden w-20 shrink-0 sm:block">
                  {movement.date.toLocaleDateString("fr-FR")}
                </div>
                <div className="text-primary-100 w-10 shrink-0 sm:hidden">
                  {movement.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </div>

                <AccountLabel accountId={movement.account} />
                <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-white">
                  {movement.name}
                </div>
                <div className="flex-1" />
                <div className="w-20 text-right whitespace-nowrap text-white">
                  {getCurrencyFormatter().format(movement.amount)}
                </div>
              </div>
            ))}

            {filteredMovements.length === 0 && (
              <div className="text-primary-100 flex w-full items-center justify-center py-2 text-sm">
                No movement waiting for reconciliation found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
