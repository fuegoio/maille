import { type Activity } from "@maille/core/activities";
import {
  getActivityMovementsReconciliated,
  getActivityMovementsReconciliatedByAccount,
} from "@maille/core/activities";
import type { MovementWithLink } from "@maille/core/movements";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Trash2, RefreshCw, Edit2 } from "lucide-react";

import { AccountLabel } from "@/components/accounts/account-label";
import { LinkMovementButton } from "@/components/movements/link-movement-button";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getCurrencyFormatter } from "@/lib/utils";
import {
  updateMovementActivityMutation,
  deleteMovementActivityMutation,
} from "@/mutations/movements";
import { useAccounts } from "@/stores/accounts";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

interface ActivityMovementsProps {
  activity: Activity;
}

export function ActivityMovements({ activity }: ActivityMovementsProps) {
  const mutate = useSync((state) => state.mutate);
  const currencyFormatter = getCurrencyFormatter();
  const accounts = useAccounts((state) => state.accounts);

  const movementsReconciliatedByAccount =
    getActivityMovementsReconciliatedByAccount(
      activity.transactions,
      activity.movements,
      accounts,
      useMovements((state) => state.getMovementById),
    );

  const getMovementById = useMovements((state) => state.getMovementById);
  const isReconciled = getActivityMovementsReconciliated(
    activity.transactions,
    activity.movements,
    accounts,
    getMovementById,
  );

  const handleMovementMenuClick = (
    movementWithLink: MovementWithLink,
    event: string,
  ) => {
    if (event === "unlink") {
      mutate({
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
        events: [
          {
            type: "deleteMovementActivity",
            payload: {
              id: movementWithLink.movementActivityId,
              activity: activity.id,
              movement: movementWithLink.id,
            },
          },
        ],
      });
    } else if (event === "resetAmount") {
      mutate({
        name: "updateMovementActivity",
        mutation: updateMovementActivityMutation,
        variables: {
          id: movementWithLink.movementActivityId,
          amount: movementWithLink.amount,
        },
        rollbackData: {
          id: movementWithLink.movementActivityId,
          movement: movementWithLink.id,
          activity: activity.id,
          amount: movementWithLink.amountLinked,
        },
        events: [
          {
            type: "updateMovementActivity",
            payload: {
              id: movementWithLink.movementActivityId,
              activity: activity.id,
              movement: movementWithLink.id,
              amount: movementWithLink.amount,
            },
          },
        ],
      });
    }
  };

  const updateAmountLinked = (
    movementWithLink: MovementWithLink,
    newAmount: number,
  ) => {
    mutate({
      name: "updateMovementActivity",
      mutation: updateMovementActivityMutation,
      variables: {
        id: movementWithLink.movementActivityId,
        amount: newAmount,
      },
      rollbackData: {
        id: movementWithLink.movementActivityId,
        movement: movementWithLink.id,
        activity: activity.id,
        amount: movementWithLink.amountLinked,
      },
      events: [
        {
          type: "updateMovementActivity",
          payload: {
            id: movementWithLink.movementActivityId,
            activity: activity.id,
            movement: movementWithLink.id,
            amount: newAmount,
          },
        },
      ],
    });
  };

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="flex items-center">
        <div className="text-sm font-medium">Movements</div>
        <div className="flex-1" />
        {!isReconciled ? (
          <TriangleAlert className="mr-1.5 size-5 text-orange-300" />
        ) : (
          <CircleCheck className="mr-1.5 size-5 text-emerald-400" />
        )}
      </div>

      <div className="my-2">
        {movementsReconciliatedByAccount.length === 0 ? (
          <div className="py-4 text-sm text-muted-foreground">
            No movement needed for this activity.
          </div>
        ) : (
          movementsReconciliatedByAccount.map(
            (movementsReconciliatedOfAccount) => (
              <div
                key={movementsReconciliatedOfAccount.account.toString()}
                className="-mx-4 mt-4 mb-2 rounded border py-4"
              >
                <div className="flex items-center px-4 text-sm">
                  <AccountLabel
                    accountId={movementsReconciliatedOfAccount.account}
                  />
                  <div className="flex-1" />
                  <div
                    className={cn(
                      "mr-4 ml-3 font-mono text-xs font-medium whitespace-nowrap",
                      !movementsReconciliatedOfAccount.reconcilied
                        ? "text-orange-300"
                        : "text-indigo-400",
                    )}
                  >
                    {currencyFormatter.format(
                      movementsReconciliatedOfAccount.movementTotal,
                    )}
                    /
                    {currencyFormatter.format(
                      movementsReconciliatedOfAccount.transactionTotal,
                    )}
                  </div>

                  <LinkMovementButton
                    activity={activity}
                    account={movementsReconciliatedOfAccount.account}
                  />
                </div>

                <div className="my-2">
                  {movementsReconciliatedOfAccount.movements.length === 0 ? (
                    <div className="mt-4 px-4 text-sm text-muted-foreground">
                      No movement added for this account.
                    </div>
                  ) : (
                    movementsReconciliatedOfAccount.movements.map(
                      (movement) => (
                        <div key={movement.id}>
                          <hr className="border-t" />

                          <div className="hover:bg-primary-700 flex h-10 items-center justify-center px-4 text-sm">
                            <div className="text-primary-100 mr-4 hidden w-16 shrink-0 sm:block">
                              {movement.date.toLocaleDateString()}
                            </div>
                            <div className="text-primary-100 mr-2 w-10 shrink-0 sm:hidden">
                              {movement.date.toLocaleDateString(undefined, {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </div>
                            <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-white">
                              {movement.name}
                              {movement.amountLinked !== movement.amount && (
                                <span className="text-primary-100 ml-2 font-mono text-sm whitespace-nowrap">
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
                                    handleMovementMenuClick(
                                      movement,
                                      "editAmount",
                                    )
                                  }
                                  className="focus:bg-primary-600"
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  <span>Modify amount linked</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMovementMenuClick(
                                      movement,
                                      "resetAmount",
                                    )
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
                                  className="focus:bg-primary-600 text-red-400 focus:text-red-300"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Unlink</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
