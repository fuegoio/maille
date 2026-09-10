import { type MovementStatus } from "@maille/core/movements";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Link, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import _ from "lodash";
import {
  BookMarked,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  Trash2,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { AddActivityButton } from "@/components/activities/add-activity-button";
import { HistoryTimeline } from "@/components/history/history-timeline";
import {
  ContextLink,
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { DebouncedInput } from "@/components/shared/debounced-text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AmountInput } from "@/components/ui/amount-input";
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
import { ACTIVITY_TYPES_COLOR, useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";
import { useProjects } from "@/stores/projects";
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
import { Badge } from "../ui/badge";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import { LinkActivityButton } from "./link-activity-button";

const MOVEMENT_STATUS_NAME: Record<MovementStatus, string> = {
  incomplete: "To reconciliate",
  completed: "Reconciled",
};

const MOVEMENT_STATUS_DESCRIPTION: Record<MovementStatus, string> = {
  incomplete:
    "This movement is not yet linked to an activity covering its full amount.",
  completed: "This movement is fully linked to activities covering its amount.",
};

const MOVEMENT_STATUS_ALERT: Record<
  MovementStatus,
  { icon: LucideIcon; className: string; descriptionClassName: string }
> = {
  incomplete: {
    icon: CircleDotDashed,
    className: "border-orange-400/25 bg-orange-400/10 text-orange-300",
    descriptionClassName: "text-orange-300/70",
  },
  completed: {
    icon: CircleCheck,
    className: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
    descriptionClassName: "text-indigo-300/70",
  },
};

function MovementStatusAlert({ status }: { status: MovementStatus }) {
  const {
    icon: Icon,
    className,
    descriptionClassName,
  } = MOVEMENT_STATUS_ALERT[status];

  return (
    <Alert className={cn("mt-6", className)}>
      <Icon />
      <AlertTitle>{MOVEMENT_STATUS_NAME[status]}</AlertTitle>
      <AlertDescription className={descriptionClassName}>
        {MOVEMENT_STATUS_DESCRIPTION[status]}
      </AlertDescription>
    </Alert>
  );
}

interface MovementPageProps {
  movementId: string;
}

export function MovementPage({ movementId }: MovementPageProps) {
  const router = useRouter();
  const currencyFormatter = useCurrencyFormatter();
  const mutate = useSync((state) => state.mutate);

  const movement = useMovements((state) => state.getMovementById(movementId));
  const movements = useMovements((state) => state.movements);

  const breadcrumbs = usePageBreadcrumbs({
    contextual: true,
    routeKey: "/movements/$id",
    own: {
      key: `movement:${movementId}`,
      label: movement?.name ?? "",
      title: movement?.name,
    },
    fallback: [
      { key: "movements", label: "Movements", target: { to: "/movements" } },
    ],
  });

  const activities = useActivities((state) => state.activities);
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const getProjectById = useProjects((state) => state.getProjectById);

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

  useHotkey("Escape", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      void router.navigate({ to: "/movements" });
    }
  });

  if (!movement) return null;

  return (
    <SidebarInset>
      <div className="flex h-full flex-col">
        <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />
          <PageBreadcrumbs entries={breadcrumbs} className="flex-1" />

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
          <div className="mx-auto w-full max-w-5xl">
            <div className="border-b px-4 py-6 sm:px-8">
              <label htmlFor="date" className="sr-only">
                Date
              </label>
              <DatePicker
                id="date"
                showIcon={false}
                value={movement.date}
                onChange={(date) => handleUpdateMovement({ date })}
                className="h-auto border-0 bg-transparent px-0 py-0.5 font-normal text-muted-foreground hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
              />

              <div className="mt-1 flex items-baseline justify-between gap-4">
                <DebouncedInput
                  key={movement.id}
                  id="name"
                  aria-label="Movement name"
                  value={movement.name}
                  onCommit={(name) => handleUpdateMovement({ name })}
                  placeholder="Movement name"
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0.5 text-3xl font-semibold md:text-3xl dark:bg-transparent"
                />
                <AmountInput
                  value={movement.amount}
                  onChange={(amount) => handleUpdateMovement({ amount })}
                  mode="field"
                  className="h-auto shrink-0 border-0 bg-transparent px-0 py-0.5 text-2xl leading-snug font-semibold dark:bg-transparent dark:hover:bg-transparent"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <AccountSelect
                  id="account"
                  value={movement.account}
                  onChange={(account) => handleUpdateMovement({ account })}
                  movementsOnly
                  className="h-auto border-0 bg-transparent px-0 py-0.5 font-normal text-muted-foreground hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
                />
              </div>

              <MovementStatusAlert status={movement.status} />
            </div>

            <div className="px-4 py-6 sm:px-8">
              <div className="flex items-center gap-1.5">
                <BookMarked className="size-3.5 text-muted-foreground" />
                <div className="text-sm font-medium">Activities</div>
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
                  movementActivities.map((movementActivity, index) => {
                    const activity = movementActivity.activity!;
                    const category = activity.category
                      ? categories.find((c) => c.id === activity.category)
                      : null;
                    const subcategory = activity.subcategory
                      ? subcategories.find((c) => c.id === activity.subcategory)
                      : null;
                    const project = activity.project
                      ? getProjectById(activity.project)
                      : null;

                    return (
                      <ContextLink
                        key={movementActivity.id}
                        to="/activities/$id"
                        params={{ id: activity.id }}
                        className={cn(
                          "group flex h-10 cursor-pointer items-center gap-2 px-4 text-sm hover:bg-muted",
                          index !== movementActivities.length - 1 && "border-b",
                        )}
                      >
                        <div
                          className={cn(
                            "size-2 shrink-0 rounded-lg",
                            ACTIVITY_TYPES_COLOR[activity.type],
                          )}
                        />

                        <div className="hidden w-12 shrink-0 text-muted-foreground lg:block">
                          {format(activity.date, "dd MMM")}
                        </div>
                        <div className="w-8 shrink-0 text-muted-foreground lg:hidden">
                          {format(activity.date, "dd MMM")}
                        </div>

                        {activity.status === "scheduled" ? (
                          <CircleDashed className="size-4 shrink-0 text-muted-foreground" />
                        ) : activity.status === "incomplete" ? (
                          <CircleDotDashed className="size-4 shrink-0 text-orange-300" />
                        ) : (
                          <CircleCheck className="size-4 shrink-0 text-indigo-300" />
                        )}

                        <div className="mr-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {activity.name}
                        </div>

                        <div className="flex-1" />

                        <div className="mr-2 flex min-w-0 items-center">
                          {category && (
                            <Badge
                              variant="outline"
                              asChild
                              className="h-6 [a]:hover:bg-border/50"
                            >
                              <Link
                                to={`/categories/$id`}
                                params={{ id: category.id }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {category.emoji && (
                                  <span className="sm:mr-0.5">
                                    {category.emoji}
                                  </span>
                                )}
                                <span className="hidden sm:inline">
                                  {category.name}
                                </span>
                              </Link>
                            </Badge>
                          )}

                          {subcategory && (
                            <>
                              <ChevronRight className="mx-1 size-4 text-muted-foreground" />
                              <Badge
                                variant="outline"
                                asChild
                                className="h-6 [a]:hover:bg-border/50"
                              >
                                <Link
                                  to={`/categories/$id/subcategories/$subcategoryId`}
                                  params={{
                                    id: category!.id,
                                    subcategoryId: subcategory.id,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {subcategory.emoji && (
                                    <span className="sm:mr-0.5">
                                      {subcategory.emoji}
                                    </span>
                                  )}
                                  <span className="hidden sm:inline">
                                    {subcategory.name}
                                  </span>
                                </Link>
                              </Badge>
                            </>
                          )}

                          {project && (
                            <>
                              <div className="mx-3 h-4 w-px bg-muted-foreground" />
                              <Badge
                                variant="secondary"
                                asChild
                                className="h-6 [a]:hover:bg-border/50"
                              >
                                <Link
                                  to={`/projects/$id`}
                                  params={{ id: project.id }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{project.emoji}</span>
                                  <span className="hidden truncate sm:inline">
                                    {project.name}
                                  </span>
                                </Link>
                              </Badge>
                            </>
                          )}
                        </div>

                        <div className="text-right font-mono font-medium whitespace-nowrap sm:min-w-16">
                          {currencyFormatter.format(movementActivity.amount)}
                        </div>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="ml-2 shrink-0"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUnlinkActivity(
                                  movementActivity.id,
                                  activity.id,
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
                      </ContextLink>
                    );
                  })
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
