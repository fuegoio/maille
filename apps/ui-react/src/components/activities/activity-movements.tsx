
import { type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useStore } from "zustand";
import { movementsStore } from "@/stores/movements";
import { accountsStore } from "@/stores/accounts";
import { eventsStore } from "@/stores/events";
import { updateMovementActivityMutation, deleteMovementActivityMutation } from "@/mutations/movements";
import { LinkMovementButton } from "@/components/movements/link-movement-button";
import { AccountLabel } from "@/components/accounts/account-label";
import { AmountInput } from "@/components/ui/amount-input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2, RefreshCw, Edit2 } from "lucide-react";
import { getActivityMovementsReconciliated, getActivityMovementsReconciliatedByAccount } from "@maille/core/activities";

interface ActivityMovementsProps {
  activity: Activity;
}

export function ActivityMovements({ activity }: ActivityMovementsProps) {
  const currencyFormatter = getCurrencyFormatter();
  const [showMovements, setShowMovements] = useState(true);
  const accounts = useStore(accountsStore, (state) => state.accounts);

  const movementsReconciliatedByAccount = getActivityMovementsReconciliatedByAccount(
    activity.transactions,
    activity.movements,
    accounts,
    movementsStore.getState().getMovementById
  );

  const isReconciled = getActivityMovementsReconciliated(
    activity.transactions,
    activity.movements,
    accounts,
    movementsStore.getState().getMovementById
  );

  const handleMovementMenuClick = (
    movementWithLink: any, // TODO: Fix proper typing
    event: string
  ) => {
    if (event === "unlink") {
      movementsStore.getState().deleteMovementActivity(
        movementWithLink.id,
        movementWithLink.movementActivityId
      );

      eventsStore.getState().sendEvent({
        name: "deleteMovementActivity",
        mutation: deleteMovementActivityMutation,
        variables: {
          id: movementWithLink.movementActivityId,
        },
        rollbackData: {
          id: movementWithLink.movementActivityId,
          movement: movementWithLink.id,
          activity: activity.id,
          amount: movementWithLink.amount,
        },
      });
    } else if (event === "resetAmount") {
      movementsStore.getState().updateMovementActivity(
        movementWithLink.id,
        movementWithLink.movementActivityId,
        movementWithLink.amount
      );

      eventsStore.getState().sendEvent({
        name: "updateMovementActivity",
        mutation: updateMovementActivityMutation,
        variables: {
          id: movementWithLink.movementActivityId,
          amount: movementWithLink.amount,
        },
        rollbackData: {
          id: movementWithLink.movementActivityId,
          movement: movementWithLink.id,
          amount: movementWithLink.amount,
        },
      });
    }
  };

  const updateAmountLinked = (
    movementWithLink: any, // TODO: Fix proper typing
    newAmount: number
  ) => {
    movementsStore.getState().updateMovementActivity(
      movementWithLink.id,
      movementWithLink.movementActivityId,
      newAmount
    );

    eventsStore.getState().sendEvent({
      name: "updateMovementActivity",
      mutation: updateMovementActivityMutation,
      variables: {
        id: movementWithLink.movementActivityId,
        amount: newAmount,
      },
      rollbackData: {
        id: movementWithLink.movementActivityId,
        movement: movementWithLink.id,
        amount: movementWithLink.amount,
      },
    });
  };

  return (
    <div className="py-6 px-4 sm:px-8 border-b">
      <div className="flex items-center">
        <button
          className="text-sm font-medium text-primary-100 rounded h-7 hover:text-white flex items-center w-full"
          onClick={() => setShowMovements(!showMovements)}
        >
          Movements
          {showMovements ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <ChevronUp className="ml-2 h-4 w-4" />
          )}

          <div className="flex-1" />
          {!isReconciled ? (
            <i className="text-xl text-orange-300 px-1">⚠️</i>
          ) : (
            <i className="text-xl text-emerald-400 px-1">✓</i>
          )}
        </button>
      </div>

      {showMovements && (
        <div className="mt-4">
          {movementsReconciliatedByAccount.length === 0 ? (
            <div className="mt-4 text-sm text-primary-300 rounded border bg-primary-800 p-4 -mx-4 sm:-mx-8">
              No movement needed for this activity.
            </div>
          ) : (
            movementsReconciliatedByAccount.map(
              (movementsReconciliatedOfAccount) => (
                <div
                  key={movementsReconciliatedOfAccount.account.toString()}
                  className="mt-4 mb-2 border bg-primary-800 rounded py-4 -mx-4 sm:-mx-8"
                >
                  <div className="flex items-center px-4">
                    <AccountLabel
                      accountId={movementsReconciliatedOfAccount.account}
                    />

                    <div className="flex-1" />

                    <div
                      className="whitespace-nowrap ml-3 font-medium text-sm mr-4 font-mono"
                      style={{
                        color: !movementsReconciliatedOfAccount.reconcilied
                          ? "#f97316"
                          : "#a5b4fc",
                      }}
                    >
                      {currencyFormatter.format(
                        movementsReconciliatedOfAccount.movementTotal
                      )}
                      /
                      {currencyFormatter.format(
                        movementsReconciliatedOfAccount.transactionTotal
                      )}
                    </div>

                    <LinkMovementButton
                      activity={activity}
                      account={movementsReconciliatedOfAccount.account}
                    />
                  </div>

                  <div className="mt-4 mb-2">
                    {movementsReconciliatedOfAccount.movements.length === 0 ? (
                      <div className="mt-4 text-sm text-primary-600 px-4">
                        No movement added for this account.
                      </div>
                    ) : (
                      movementsReconciliatedOfAccount.movements.map(
                        (movement) => (
                          <div key={movement.id}>
                            <hr className="border-t" />

                            <div className="h-10 flex items-center justify-center text-sm hover:bg-primary-700 px-4">
                              <div className="hidden sm:block text-primary-100 w-16 mr-4 shrink-0">
                                {movement.date.toLocaleDateString()}
                              </div>
                              <div className="sm:hidden text-primary-100 w-10 mr-2 shrink-0">
                                {movement.date.toLocaleDateString(undefined, {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </div>
                              <div className="ml-1 text-white text-ellipsis overflow-hidden whitespace-nowrap">
                                {movement.name}
                                {movement.amountLinked !== movement.amount && (
                                  <span className="text-sm text-primary-100 ml-2 whitespace-nowrap font-mono">
                                    ({currencyFormatter.format(movement.amount)})
                                  </span>
                                )}
                              </div>

                              <div className="flex-1" />

                              <AmountInput
                                value={movement.amountLinked}
                                onChange={(amount) =>
                                  updateAmountLinked(movement, amount)
                                }
                                className="mr-4 w-24"
                              />

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <span className="sr-only">Actions</span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="text-primary-100"
                                    >
                                      <path d="M12 16a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2" />
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-primary-700 border-primary-600">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMovementMenuClick(movement, "editAmount")
                                    }
                                    className="focus:bg-primary-600"
                                  >
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    <span>Modify amount linked</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMovementMenuClick(movement, "resetAmount")
                                    }
                                    className="focus:bg-primary-600"
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    <span>Reset amount linked</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMovementMenuClick(movement, "unlink")
                                    }
                                    className="text-red-400 focus:bg-primary-600 focus:text-red-300"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Unlink</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      )
                    )}
                    <hr className="border-t" />
                  </div>
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}