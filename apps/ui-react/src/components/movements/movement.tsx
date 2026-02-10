import type { Movement } from "@maille/core/movements";
import { useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import _ from "lodash";
import { ChevronRight, MoreVertical } from "lucide-react";
import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";

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
import { getCurrencyFormatter, cn } from "@/lib/utils";
import {
  deleteMovementMutation,
  updateMovementMutation,
} from "@/mutations/movements";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

interface MovementProps {
  movementId: string;
  onClose: () => void;
}

export function Movement({ movementId, onClose }: MovementProps) {
  const router = useRouter();
  const mainElement = React.useRef<HTMLDivElement>(null);
  const [showMovement, setShowMovement] = React.useState(true);
  const [showProperties, setShowProperties] = React.useState(true);
  const [showActivities, setShowActivities] = React.useState(true);

  const movement = useMovements((state) =>
    state.getMovementById(movementId),
  );

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

  const deleteMovement = useMovements((state) => state.deleteMovement);
  const updateMovement = useMovements((state) => state.updateMovement);
  const mutate = useSync((state) => state.mutate);

  const handleMovementMenuClick = (event: string) => {
    if (!movement) return;

    if (event === "delete") {
      const movementData = _.cloneDeep(movement);
      deleteMovement(movementId);

      mutate({
        name: "deleteMovement",
        mutation: deleteMovementMutation,
        variables: {
          id: movementId,
        },
        rollbackData: movementData,
      });

      onClose();
    }
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
    handleUpdateMovement(movementId, update);

    mutate({
      name: "updateMovement",
      mutation: updateMovementMutation,
      variables: {
        id: movementId,
        ...update,
        date: update.date?.toISOString().split("T")[0],
      },
      rollbackData: {
        ...movementData,
        date: movementData.date.toISOString().split("T")[0],
      },
    });
  };

  // Hotkeys
  useHotkeys("escape", () => {
    onClose();
  });

  if (!movement || !showMovement) return null;

  return (
    <div
      ref={mainElement}
      className="bg-primary-900 absolute top-0 left-0 flex h-full w-full max-w-full flex-col overflow-hidden rounded border shadow-xl @5xl:relative @5xl:w-[575px]"
    >
      <div className="flex h-14 w-full flex-shrink-0 items-center border-b px-4 sm:px-6">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 sm:mr-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => handleMovementMenuClick("delete")}
            >
              <div className="flex items-center gap-2">
                <i
                  className="mdi mdi-delete text-destructive"
                  aria-hidden="true"
                />
                <span>Delete</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                onChange={(date) => updateMovement({ date })}
                className="h-8 text-sm font-medium text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">Amount</div>
              <div className="flex-1" />
              <AmountInput
                value={movement.amount}
                onChange={(amount) => updateMovement({ amount })}
                className="h-8 text-sm font-medium text-white"
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
  );
}
