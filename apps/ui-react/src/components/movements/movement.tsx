import { useHotkey } from "@tanstack/react-hotkeys";
import { Link, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import _ from "lodash";
import { Trash2, Unlink } from "lucide-react";
import * as React from "react";

import { AddActivityButton } from "@/components/activities/add-activity-button";
import { HistoryTimeline } from "@/components/history/history-timeline";
import { AmountInput } from "@/components/ui/amount-input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkflowSection } from "@/components/workflows/workflow-section";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import {
  movementUpdateHistoryEvent,
  unlinkActivityHistoryEvent,
  unlinkMovementHistoryEvent,
} from "@/lib/history-events";
import { cn } from "@/lib/utils";
import {
  deleteMovementActivityMutation,
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
import { LinkActivityButton } from "./link-activity-button";

interface MovementPageProps {
  movementId: string;
}

export function MovementPage({ movementId }: MovementPageProps) {
  const router = useRouter();
  const currencyFormatter = useCurrencyFormatter();
  const mutate = useSync((state) => state.mutate);

  const movement = useMovements((state) => state.getMovementById(movementId));
  const movements = useMovements((state) => state.movements);

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

    // Expected history: unlink entry on every linked activity's timeline
    const unlinkEvents = movement.activities
      .map((ma) => {
        const linkedActivity = useActivities
          .getState()
          .getActivityById(ma.activity);
        return linkedActivity
          ? unlinkActivityHistoryEvent(
              linkedActivity,
              { id: movement.id, name: movement.name },
              ma.amount,
            )
          : null;
      })
      .filter((event) => event !== null);

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
        ...unlinkEvents,
      ],
    });

    void router.navigate({ to: "/movements" });
  };

  const handleUpdateMovement = (update: {
    date?: Date;
    amount?: number;
    account?: string;
    name?: string;
  }) => {
    if (!movement) return;
    const movementData = _.cloneDeep(movement);
    const historyEvent = movementUpdateHistoryEvent(movement, update);
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
        ...(historyEvent ? [historyEvent] : []),
      ],
    });
  };

  const handleUnlinkActivity = (
    movementActivityId: string,
    activityId: string,
    amount: number,
  ) => {
    if (!movement) return;
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const historyEvents = [
      unlinkMovementHistoryEvent(
        movement,
        { id: activity.id, name: activity.name },
        amount,
      ),
      unlinkActivityHistoryEvent(
        activity,
        { id: movement.id, name: movement.name },
        amount,
      ),
    ];

    mutate({
      name: "deleteMovementActivity",
      mutation: deleteMovementActivityMutation,
      variables: { id: movementActivityId },
      rollbackData: {
        id: movementActivityId,
        movement: movement.id,
        activity: activityId,
        amount,
      },
      events: [
        {
          type: "deleteMovementActivity",
          payload: {
            id: movementActivityId,
            activity: activityId,
            movement: movement.id,
          },
        },
        ...historyEvents,
      ],
    });
  };

  // Hotkeys to navigate between movements (same order as the movements table)
  const sortedMovements = React.useMemo(() => {
    return [...movements].sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [movements]);

  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    if (sortedMovements.length === 0) return;

    const currentIndex = sortedMovements.findIndex((m) => m.id === movementId);
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex - 1 + sortedMovements.length) % sortedMovements.length;

    void router.navigate({
      to: "/movements/$id",
      params: { id: sortedMovements[nextIndex].id },
      replace: true,
    });
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    if (sortedMovements.length === 0) return;

    const currentIndex = sortedMovements.findIndex((m) => m.id === movementId);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % sortedMovements.length;

    void router.navigate({
      to: "/movements/$id",
      params: { id: sortedMovements[nextIndex].id },
      replace: true,
    });
  });

  if (!movement) return null;

  return (
    <SidebarInset>
      <div className="flex h-full flex-col">
        <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />
          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList>
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink asChild>
                  <Link to="/movements">Movements</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate" title={movement.name}>
                  {movement.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

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
        </header>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="mx-auto w-full max-w-3xl">
            <div className="border-b px-4 py-8 sm:px-8">
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

            <div className="px-4 py-6 sm:px-8">
              <div className="flex items-center">
                <div className="text-sm font-medium">Activities linked</div>
                <div className="flex-1" />

                <div className="flex items-center gap-2">
                  <LinkActivityButton movement={movement} size="sm" />
                  <AddActivityButton movement={movement} size="sm" />
                </div>
              </div>

              <div className="mt-4 mb-2 rounded border bg-muted/50">
                {movementActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                    No activity linked to this movement yet.
                  </div>
                ) : (
                  movementActivities.map((movementActivity, index) => (
                    <div
                      key={movementActivity.id}
                      className={cn(
                        "group flex h-10 items-center px-4 text-sm hover:bg-muted",
                        index !== movementActivities.length - 1 && "border-b",
                      )}
                    >
                      <div
                        className="flex flex-1 cursor-pointer items-center justify-center"
                        onClick={() =>
                          router.navigate({
                            to: "/activities/$id",
                            params: { id: movementActivity.activity!.id },
                          })
                        }
                      >
                        <div className="hidden w-20 shrink-0 text-muted-foreground sm:block">
                          {format(
                            movementActivity.activity!.date,
                            "dd/MM/yyyy",
                          )}
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="ml-2 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlinkActivity(
                                movementActivity.id,
                                movementActivity.activity!.id,
                                movementActivity.amount,
                              );
                            }}
                          >
                            <Unlink className="size-3.5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unlink activity</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))
                )}
              </div>
            </div>

            <WorkflowSection movementId={movementId} />

            {movement.history.length > 0 && (
              <div className="border-t px-4 py-6 sm:px-8">
                <HistoryTimeline
                  entityType="movement"
                  history={movement.history}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
