import type { Movement } from "@maille/core/movements";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import _ from "lodash";
import { ChevronRight, Trash2 } from "lucide-react";
import * as React from "react";

import { AddActivityButton } from "@/components/activities/add-activity-button";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import {
  deleteMovementMutation,
  updateMovementMutation,
} from "@/mutations/movements";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

import { AccountSelect } from "../accounts/account-select";
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
import { Field, FieldGroup, FieldLabel, FieldSet } from "../ui/field";
import { Input } from "../ui/input";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";

export function Movement() {
  const router = useRouter();
  const currencyFormatter = useCurrencyFormatter();
  const movementId = useMovements((state) => state.focusedMovement);
  const setFocusedMovement = useMovements((state) => state.setFocusedMovement);

  const onClose = () => {
    setFocusedMovement(null);
  };

  const mutate = useSync((state) => state.mutate);

  const movement = useMovements((state) =>
    movementId ? state.getMovementById(movementId) : undefined,
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

  const focusActivity = async (activityId: string) => {
    await router.navigate({
      to: "/activities/{-$id}",
      params: { id: activityId },
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
          type: "updateMovement",
          payload: {
            id: movement.id,
            ...update,
            date: update.date ? getGraphQLDate(update.date) : undefined,
          },
        },
      ],
    });
  };

  // Hotkeys
  useHotkey("Escape", () => {
    onClose();
  });

  if (!movement) return null;

  return (
    <SidebarInset className="xl:max-w-lg">
      <div className="flex h-full flex-col">
        <div className="flex h-12 w-full shrink-0 items-center gap-2 border-b px-4 sm:px-6">
          <SidebarTrigger className="xl:hidden" />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronRight />
          </Button>
          <div className="text-sm font-medium">Movement</div>

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

        <div className="mb-4 px-4 pt-6 sm:px-8">
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <DatePicker
                  value={movement.date}
                  id="date"
                  onChange={(date) => handleUpdateMovement({ date })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="name">Movement name</FieldLabel>
                <Input
                  id="name"
                  value={movement.name}
                  onChange={(e) =>
                    handleUpdateMovement({ name: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="account">Account</FieldLabel>
                <AccountSelect
                  id="account"
                  value={movement.account}
                  onChange={(account) => handleUpdateMovement({ account })}
                  movementsOnly
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="amount">Amount</FieldLabel>
                <AmountInput
                  value={movement.amount}
                  onChange={(amount) => handleUpdateMovement({ amount })}
                  mode="field"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>

        <div className="border-t px-4 py-6 sm:px-8">
          <div className="flex items-center">
            <div className="text-sm font-medium">Activities linked</div>
            <div className="flex-1" />

            <AddActivityButton movement={movement} />
          </div>

          <div className="mt-4 mb-2 rounded border bg-muted/50">
            {movementActivities.length === 0 ? (
              <div className="text-primary-300 flex items-center justify-center py-4 text-xs">
                No activity linked to this movement yet.
              </div>
            ) : (
              movementActivities.map((movementActivity, index) => (
                <div
                  key={movementActivity.id}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center px-4 text-sm hover:bg-muted",
                    index !== movementActivities.length - 1 && "border-b",
                  )}
                  onClick={() => focusActivity(movementActivity.activity!.id)}
                >
                  <div className="hidden w-20 shrink-0 text-muted-foreground sm:block">
                    {format(movementActivity.activity!.date, "dd/MM/yyyy")}
                  </div>
                  <div className="w-10 shrink-0 text-muted-foreground sm:hidden">
                    {format(movementActivity.activity!.date, "dd/MM")}
                  </div>

                  <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {movementActivity.activity!.name}
                  </div>
                  <div className="flex-1" />
                  <div className="w-20 text-right font-mono whitespace-nowrap">
                    {currencyFormatter.format(movementActivity.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
