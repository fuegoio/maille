import * as React from "react";
import { useStore } from "zustand";
import { movementsStore } from "@/stores/movements";
import { activitiesStore } from "@/stores/activities";
import { eventsStore } from "@/stores/events";
import { AccountLabel } from "@/components/accounts/account-label";
import { getCurrencyFormatter, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { deleteMovementMutation, updateMovementMutation } from "@/mutations/movements";
import { useRouter } from "@tanstack/react-router";
import type { Movement } from "@maille/core/movements";
import type { UUID } from "crypto";
import _ from "lodash";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePicker } from "@/components/ui/date-picker";
import { AmountInput } from "@/components/ui/amount-input";
import { AddActivityButton } from "@/components/activities/add-activity-button";

interface MovementProps {
  movementId: UUID;
  onClose: () => void;
}

export function Movement({ movementId, onClose }: MovementProps) {
  const router = useRouter();
  const mainElement = React.useRef<HTMLDivElement>(null);
  const [showMovement, setShowMovement] = React.useState(true);
  const [showProperties, setShowProperties] = React.useState(true);
  const [showActivities, setShowActivities] = React.useState(true);

  const movement = useStore(movementsStore, (state) => 
    state.getMovementById(movementId)
  );
  
  const activities = useStore(activitiesStore, (state) => state.activities);

  const movementActivities = React.useMemo(() => {
    if (!movement) return [];
    return movement.activities.map((ma) => ({
      ...ma,
      activity: activities.find((a) => a.id === ma.activity),
    })).filter((ma) => ma.activity !== undefined);
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

  const handleMovementMenuClick = (event: string) => {
    if (!movement) return;

    if (event === "delete") {
      const movementData = _.cloneDeep(movement);
      movementsStore.getState().deleteMovement(movementId);

      eventsStore.getState().sendEvent({
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
    router.navigate({ to: "/activities/$id", params: { id: activityNumber.toString() } });
  };

  const updateMovement = (update: {
    date?: Date;
    amount?: number;
    account?: UUID;
    name?: string;
  }) => {
    if (!movement) return;

    const movementData = _.cloneDeep(movement);
    movementsStore.getState().updateMovement(movementId, update);

    eventsStore.getState().sendEvent({
      name: "updateMovement",
      mutation: updateMovementMutation,
      variables: {
        id: movementId,
        ...update,
        date: update.date?.toISOString().split('T')[0],
      },
      rollbackData: {
        ...movementData,
        date: movementData.date.toISOString().split('T')[0],
      },
    });
  };

  // Hotkeys
  useHotkeys('escape', () => {
    onClose();
  });

  if (!movement || !showMovement) return null;

  return (
    <div
      ref={mainElement}
      className="absolute top-0 left-0 @5xl:relative flex flex-col w-full @5xl:w-[575px] max-w-full h-full overflow-hidden border bg-primary-900 shadow-xl rounded"
    >
      <div className="flex items-center px-4 sm:px-6 border-b w-full flex-shrink-0 h-14">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="w-6 h-8 ml-8 lg:ml-0 mr-4"
          onClick={onClose}
        >
          <ChevronRight className="h-6 w-6 transition hover:text-white" />
        </Button>
        <div className="text-white text-sm font-medium">Movement</div>

        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 sm:mr-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => handleMovementMenuClick("delete")}>
              <div className="flex items-center gap-2">
                <i className="mdi mdi-delete text-destructive" aria-hidden="true" />
                <span>Delete</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 sm:px-8 pt-6 mb-4 flex items-center">
        <div className="flex">
          <div className="text-sm border px-2.5 h-8 flex items-center text-primary-500 rounded -mx-2 bg-primary-700">
            <AccountLabel accountId={movement.account} />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-6 border-b text-white min-w-0 font-bold text-lg">
        {movement.name}
      </div>

      <div className="py-6 px-4 sm:px-8 border-b">
        <div className="flex">
          <button
            className="-ml-2 text-sm font-medium px-2 rounded h-7 hover:text-white flex items-center gap-2"
            onClick={() => setShowProperties(!showProperties)}
          >
            <span>Properties</span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showProperties ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {showProperties && (
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
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

      <div className="py-6 px-4 sm:px-8">
        <div className="flex">
          <button
            className="-ml-2 text-sm font-medium text-primary-100 px-2 rounded h-7 hover:text-white flex items-center gap-2"
            onClick={() => setShowActivities(!showActivities)}
          >
            <span>Activities linked</span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showActivities ? 'rotate-90' : ''}`} />
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
          <div className="mt-4 mb-2 bg-primary-800 -mx-4 rounded border">
            {movementActivities.length === 0 ? (
              <div className="flex items-center justify-center text-primary-300 text-xs py-4">
                No activity linked to this movement yet.
              </div>
            ) : (
              movementActivities.map((movementActivity, index) => (
                <div
                  key={movementActivity.id}
                  className={cn(
                    "h-10 flex items-center justify-center text-sm px-4 hover:bg-primary-600/20",
                    index !== movementActivities.length - 1 && "border-b"
                  )}
                  onClick={() => focusActivity(movementActivity.activity!.number)}
                >
                  <div className="w-8 text-primary-100 hidden sm:block shrink-0">
                    #{movementActivity.activity!.number}
                  </div>
                  <div className="hidden sm:block text-primary-100 w-20 shrink-0 ml-2">
                    {movementActivity.activity!.date.toLocaleDateString('fr-FR')}
                  </div>
                  <div className="sm:hidden text-primary-100 w-10 shrink-0">
                    {movementActivity.activity!.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </div>

                  <div className="ml-1 text-white text-ellipsis overflow-hidden whitespace-nowrap">
                    {movementActivity.activity!.name}
                  </div>
                  <div className="flex-1" />
                  <div className="w-20 whitespace-nowrap text-right text-white font-mono">
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





