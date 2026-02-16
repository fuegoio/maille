import type { Movement } from "@maille/core/movements";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import _ from "lodash";
import { ChevronRight, MoreVertical, Trash2 } from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getGraphQLDate } from "@/lib/date";
import { getCurrencyFormatter, cn } from "@/lib/utils";
import {
  deleteMovementMutation,
  updateMovementMutation,
} from "@/mutations/movements";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { SidebarInset } from "../ui/sidebar";

export function Movement() {
  const router = useRouter();
  const movementId = useMovements((state) => state.focusedMovement);
  const setFocusedMovement = useMovements((state) => state.setFocusedMovement);

  const onClose = () => {
    setFocusedMovement(null);
  };

  const [showMovement, setShowMovement] = React.useState(true);
  const [showProperties, setShowProperties] = React.useState(true);
  const [showActivities, setShowActivities] = React.useState(true);
  const mutate = useSync((state) => state.mutate);

  const movement = useMovements((state) => state.getMovementById(movementId));

  const activities = useActivities((state) => state.activities);

  const movementActivities = React.useMemo(() => {
    if (!movement) return [];
    return movement.activities
      .map((ma) => ({
        ...ma,
        activity: activities.find((a) => a.id === ma.activity),
      }))
      .filter((ma) => ma.activity !== undefined);
  }, [movement, activities]);

  // Animation logic
  React.useEffect(() => {
    if (movementId) {
      if (showMovement) return;

      setShowMovement(true);
    } else {
      // Exit animation
      setTimeout(() => {
        setShowMovement(false);
      }, 100);
    }
  }, [movementId]);

  const deleteMovement = () => {
    if (!movement) return;
    const movementData = _.cloneDeep(movement);
    mutate({
      name: "deleteMovement",
      mutation: deleteMovementMutation,
      variables: {
        id: movement.id,
      },
      rollbackData: movementData,
      events: [
        {
          type: "deleteMovement",
          payload: {
            id: movement.id,
          },
        },
      ],
    });
  };

  const focusActivity = (activityNumber: number) => {
    router.navigate({
      to: "/activities/$id",
      params: { id: activityNumber.toString() },
    });
  };

  const handleUpdateMovement = (update: {
    date?: Date;
    amount?: number;
    account?: string;
    name?: string;
  }) => {
    if (!movement) return;
    const movementData = _.cloneDeep(movement);
    mutate({
      name: "updateMovement",
      mutation: updateMovementMutation,
      variables: {
        id: movement.id,
        ...update,
        date: update.date ? getGraphQLDate(update.date) : undefined,
      },
      rollbackData: {
        ...movementData,
        date: getGraphQLDate(movementData.date),
      },
      events: [
        {
          name: "updateMovement",
          data: {
            id: movement.id,
            ...update,
          },
        },
      ],
    });
  };

  // Hotkeys
  useHotkey("Escape", () => {
    onClose();
  });

  if (!movement || !showMovement) return null;

  return (
    <SidebarInset className="max-w-lg">
      <div className="flex h-full flex-col">
        <div className="flex h-12 w-full shrink-0 items-center border-b px-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-4 ml-8 h-8 w-6 lg:ml-0"
            onClick={onClose}
          >
            <ChevronRight className="h-6 w-6 transition hover:text-white" />
          </Button>
          <div className="text-sm font-medium text-white">Movement</div>

          <div className="flex-1" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete movement</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this movement? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteMovement}
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mb-4 flex items-center px-4 pt-6 sm:px-8">
          <div className="flex">
            <div className="text-primary-500 bg-primary-700 -mx-2 flex h-8 items-center rounded border px-2.5 text-sm">
              <AccountLabel accountId={movement.account} />
            </div>
          </div>
        </div>

        <div className="min-w-0 border-b px-4 pb-6 text-lg font-bold text-white sm:px-8">
          {movement.name}
        </div>

        <div className="border-b px-4 py-6 sm:px-8">
          <div className="flex">
            <button
              className="-ml-2 flex h-7 items-center gap-2 rounded px-2 text-sm font-medium hover:text-white"
              onClick={() => setShowProperties(!showProperties)}
            >
              <span>Properties</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${showProperties ? "rotate-90" : ""}`}
              />
            </button>
          </div>

          {showProperties && (
            <div className="space-y-4 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm">Date</div>
                <div className="flex-1" />
                <DatePicker
                  value={movement.date}
                  onChange={(date) => handleUpdateMovement({ date })}
                  className="h-8 text-sm font-medium text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">Amount</div>
                <div className="flex-1" />
                <AmountInput
                  value={movement.amount}
                  onChange={(amount) => handleUpdateMovement({ amount })}
                  className="h-8 text-sm font-medium text-white"
                  mode="field"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-6 sm:px-8">
          <div className="flex">
            <button
              className="text-primary-100 -ml-2 flex h-7 items-center gap-2 rounded px-2 text-sm font-medium hover:text-white"
              onClick={() => setShowActivities(!showActivities)}
            >
              <span>Activities linked</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${showActivities ? "rotate-90" : ""}`}
              />
            </button>

            <div className="flex-1" />

            {showActivities && (
              <AddActivityButton
                movement={movement}
                className="-mr-2"
                onCreate={focusActivity}
              />
            )}
          </div>

          {showActivities && (
            <div className="bg-primary-800 -mx-4 mt-4 mb-2 rounded border">
              {movementActivities.length === 0 ? (
                <div className="text-primary-300 flex items-center justify-center py-4 text-xs">
                  No activity linked to this movement yet.
                </div>
              ) : (
                movementActivities.map((movementActivity, index) => (
                  <div
                    key={movementActivity.id}
                    className={cn(
                      "hover:bg-primary-600/20 flex h-10 items-center justify-center px-4 text-sm",
                      index !== movementActivities.length - 1 && "border-b",
                    )}
                    onClick={() =>
                      focusActivity(movementActivity.activity!.number)
                    }
                  >
                    <div className="text-primary-100 hidden w-8 shrink-0 sm:block">
                      #{movementActivity.activity!.number}
                    </div>
                    <div className="text-primary-100 ml-2 hidden w-20 shrink-0 sm:block">
                      {movementActivity.activity!.date.toLocaleDateString(
                        "fr-FR",
                      )}
                    </div>
                    <div className="text-primary-100 w-10 shrink-0 sm:hidden">
                      {movementActivity.activity!.date.toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                        },
                      )}
                    </div>

                    <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-white">
                      {movementActivity.activity!.name}
                    </div>
                    <div className="flex-1" />
                    <div className="w-20 text-right font-mono whitespace-nowrap text-white">
                      {getCurrencyFormatter().format(movementActivity.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  );
}
