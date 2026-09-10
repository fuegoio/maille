import type { MovementWithLink } from "@maille/core/movements";

import { type Activity } from "@maille/core/activities";
import {
  getActivityMovementsReconciliated,
  getActivityMovementsReconciliatedByAccount,
} from "@maille/core/activities";
import { CircleCheck, Ellipsis, Landmark, TriangleAlert } from "lucide-react";
import { Trash2, RefreshCw, Edit2 } from "lucide-react";

import { AccountLabel } from "@/components/accounts/account-label";
import { LinkMovementButton } from "@/components/movements/link-movement-button";
import { ContextLink } from "@/components/navigation/breadcrumbs";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import {
  unlinkActivityHistoryEvent,
  unlinkMovementHistoryEvent,
  updateLinkActivityHistoryEvent,
  updateLinkMovementHistoryEvent,
} from "@/lib/history-events";
import { cn } from "@/lib/utils";
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
      const historyEvents = [
        unlinkMovementHistoryEvent(
          movementWithLink,
          { id: activity.id, name: activity.name },
          movementWithLink.amountLinked,
        ),
        unlinkActivityHistoryEvent(
          activity,
          { id: movementWithLink.id, name: movementWithLink.name },
          movementWithLink.amountLinked,
        ),
      ];
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
          ...historyEvents,
        ],
      });
    } else if (event === "resetAmount") {
      const historyEvents = [
        updateLinkMovementHistoryEvent(
          movementWithLink,
          { id: activity.id, name: activity.name },
          movementWithLink.amountLinked,
          movementWithLink.amount,
        ),
        updateLinkActivityHistoryEvent(
          activity,
          { id: movementWithLink.id, name: movementWithLink.name },
          movementWithLink.amountLinked,
          movementWithLink.amount,
        ),
      ].filter((historyEvent) => historyEvent !== null);
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
          ...historyEvents,
        ],
      });
    }
  };

  const updateAmountLinked = (
    movementWithLink: MovementWithLink,
    newAmount: number,
  ) => {
    const historyEvents = [
      updateLinkMovementHistoryEvent(
        movementWithLink,
        { id: activity.id, name: activity.name },
        movementWithLink.amountLinked,
        newAmount,
      ),
      updateLinkActivityHistoryEvent(
        activity,
        { id: movementWithLink.id, name: movementWithLink.name },
        movementWithLink.amountLinked,
        newAmount,
      ),
    ].filter((historyEvent) => historyEvent !== null);
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
        ...historyEvents,
      ],
    });
  };

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="flex items-center">
        <div>
          <div className="flex items-center gap-1.5">
            <Landmark className="size-3.5 text-muted-foreground" />
            <div className="text-base font-medium">Movements</div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Bank records reconciled with this activity's transactions.
          </div>
        </div>
        <div className="flex-1" />
        {!isReconciled ? (
          <TriangleAlert className="size-5 text-orange-300" />
        ) : (
          <CircleCheck className="size-5 text-indigo-400" />
        )}
      </div>

      <div className="mt-5 space-y-3">
        {movementsReconciliatedByAccount.length === 0 ? (
          <div className="py-4 text-sm text-muted-foreground">
            No movement needed for this activity.
          </div>
        ) : (
          movementsReconciliatedByAccount.map(
            (movementsReconciliatedOfAccount) => (
              <div
                key={movementsReconciliatedOfAccount.account.toString()}
                className="rounded-lg border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center text-sm">
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
                  <div className="mt-2 border-t py-3 text-sm text-muted-foreground">
                    No movement added for this account.
                  </div>
                ) : (
                  movementsReconciliatedOfAccount.movements.map((movement) => (
                    <div key={movement.id}>
                      <hr className="my-2 border-t" />

                      <div className="flex items-center text-sm">
                        <div className="mr-4 hidden w-16 shrink-0 text-muted-foreground sm:block">
                          {movement.date.toLocaleDateString()}
                        </div>
                        <div className="mr-2 w-10 shrink-0 text-muted-foreground sm:hidden">
                          {movement.date.toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </div>
                        <ContextLink
                          to="/movements/$id"
                          params={{ id: movement.id }}
                          className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap hover:underline"
                        >
                          {movement.name}
                          {movement.amountLinked !== movement.amount && (
                            <span className="ml-2 font-mono text-sm whitespace-nowrap text-muted-foreground">
                              ({currencyFormatter.format(movement.amount)})
                            </span>
                          )}
                        </ContextLink>

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
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Movement actions"
                            >
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
