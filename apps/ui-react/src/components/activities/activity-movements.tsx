import { type Activity } from "@maille/core/activities";
import {
  getActivityMovementsReconciliated,
  getActivityMovementsReconciliatedByAccount,
} from "@maille/core/activities";
import type { MovementWithLink } from "@maille/core/movements";
import { CircleCheck, Ellipsis, TriangleAlert } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
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
  const currencyFormatter = useCurrencyFormatter();
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
          <CircleCheck className="mr-1.5 size-5 text-indigo-400" />
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
                className="-mx-4 mt-4 mb-2 rounded border py-2"
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

                {movementsReconciliatedOfAccount.movements.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No movement added for this account.
                  </div>
                ) : (
                  movementsReconciliatedOfAccount.movements.map((movement) => (
                    <div key={movement.id}>
                      <hr className="my-1 border-t" />

                      <div className="flex items-center justify-center px-4 text-sm">
                        <div className="mr-4 hidden w-16 shrink-0 text-muted-foreground sm:block">
                          {movement.date.toLocaleDateString()}
                        </div>
                        <div className="mr-2 w-10 shrink-0 text-muted-foreground sm:hidden">
                          {movement.date.toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </div>
                        <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {movement.name}
                          {movement.amountLinked !== movement.amount && (
                            <span className="ml-2 font-mono text-sm whitespace-nowrap text-muted-foreground">
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
                          mode="cell"
                          className="mr-1 w-24 text-xs"
                        />

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Ellipsis />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                handleMovementMenuClick(movement, "editAmount")
                              }
                            >
                              <Edit2 />
                              Modify amount linked
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleMovementMenuClick(movement, "resetAmount")
                              }
                            >
                              <RefreshCw />
                              Reset amount linked
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleMovementMenuClick(movement, "unlink")
                              }
                              variant="destructive"
                            >
                              <Trash2 />
                              Unlink
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
