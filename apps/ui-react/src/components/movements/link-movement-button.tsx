import * as React from "react";
import { useStore } from "zustand";
import { movementsStore } from "@/stores/movements";
import { accountsStore } from "@/stores/accounts";
import { eventsStore } from "@/stores/events";
import { createMovementActivityMutation } from "@/mutations/movements";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountLabel } from "@/components/accounts/account-label";
import { getCurrencyFormatter } from "@/lib/utils";
import { getActivityTransactionsSumByAccount } from "@maille/core/activities";
import { searchCompare } from "@/lib/strings";
import type { Movement } from "@maille/core/movements";
import type { Activity } from "@maille/core/activities";
import type { UUID } from "crypto";
import _ from "lodash";

interface LinkMovementButtonProps {
  activity: Activity;
  account: UUID;
  className?: string;
}

export function LinkMovementButton({ 
  activity, 
  account, 
  className 
}: LinkMovementButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterAmount, setFilterAmount] = React.useState(true);

  const movements = useStore(movementsStore, (state) => state.movements);
  const accounts = useStore(accountsStore, (state) => state.accounts);

  const filteredMovements = React.useMemo(() => {
    const transactionsSumByAccount = getActivityTransactionsSumByAccount(
      activity.transactions,
      accounts
    );
    const transactionsSumOfAccount = transactionsSumByAccount.find(
      (tba) => tba.account === account
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

        if (
          search !== "" &&
          !searchCompare(search, m.name)
        )
          return false;

        return true;
      }),
      ["date"],
      ["desc"]
    );
  }, [movements, accounts, activity.transactions, account, filterAmount, search]);

  const linkMovement = async (movement: Movement) => {
    const movementActivity = movementsStore.getState().createMovementActivity(
      activity.id,
      movement.id,
      movement.amount
    );

    eventsStore.getState().sendEvent({
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
        <DialogContent className="sm:max-w-2xl max-h-[400px] flex flex-col">
          <DialogHeader>
            <div className="flex mb-2">
              <div className="text-xs bg-primary-400 px-2.5 h-6 flex items-center text-white rounded font-medium">
                #{activity.number} - {activity.name}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a movement ..."
                className="pl-1 text-left min-w-0 border-none h-10 text-lg bg-transparent flex-1 text-white outline-none"
                autoFocus
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`transition ${filterAmount ? 'text-primary-400' : 'text-primary-400'}`}
                onClick={() => setFilterAmount(!filterAmount)}
              >
                <i className="mdi mdi-currency-eur text-base" aria-hidden="true" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-3 py-3 overflow-auto flex-1">
            {filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center text-sm shrink-0 h-8 rounded hover:bg-primary-600 px-2 my-1 cursor-pointer"
                onClick={() => linkMovement(movement)}
              >
                <div className="hidden sm:block text-primary-100 w-20 shrink-0">
                  {movement.date.toLocaleDateString('fr-FR')}
                </div>
                <div className="sm:hidden text-primary-100 w-10 shrink-0">
                  {movement.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </div>

                <AccountLabel accountId={movement.account} />
                <div className="ml-1 text-white text-ellipsis overflow-hidden whitespace-nowrap">
                  {movement.name}
                </div>
                <div className="flex-1" />
                <div className="w-20 whitespace-nowrap text-right text-white">
                  {getCurrencyFormatter().format(movement.amount)}
                </div>
              </div>
            ))}

            {filteredMovements.length === 0 && (
              <div className="flex items-center justify-center w-full text-primary-100 text-sm py-2">
                No movement waiting for reconciliation found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}