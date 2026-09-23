import type { Activity, ActivityStatus } from "@maille/core/activities";

import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  Copy,
  Ellipsis,
  Lock,
  MoveRight,
  Scissors,
  Trash2,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import {
  ContextLink,
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import {
  DebouncedInput,
  DebouncedTextarea,
} from "@/components/shared/debounced-text-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RollingAmount } from "@/components/ui/rolling-amount";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import {
  activityCreateHistoryEvent,
  activityUpdateHistoryEvent,
  unlinkMovementHistoryEvent,
} from "@/lib/history-events";
import { cn } from "@/lib/utils";
import { duplicateActivities } from "@/logic/activities";
import {
  createActivityMutation,
  updateActivityMutation,
  deleteActivityMutation,
} from "@/mutations/activities";
import { useActivities } from "@/stores/activities";
import { useAssets } from "@/stores/assets";
import { useAssetDepreciations } from "@/stores/depreciations";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

import { HistoryTimeline } from "../history/history-timeline";
import { ProjectSelect } from "../projects/project-select";
import { DatePicker } from "../ui/date-picker";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import { ActivityAmountsValue } from "./activity-amounts";
import { ActivityCategorySelect } from "./activity-category-select";
import { ActivityMovements } from "./activity-movements";
import { ActivitySharing } from "./activity-sharing";
import { ActivitySubcategorySelect } from "./activity-subcategory-select";
import { ActivityTransactions } from "./activity-transactions";
import { SplitActivityModal } from "./split-activity-modal";

const ACTIVITY_STATUS_NAME: Record<ActivityStatus, string> = {
  scheduled: "Scheduled",
  incomplete: "Needs reconciliation",
  completed: "Reconciled",
};

const ACTIVITY_STATUS_DESCRIPTION: Record<ActivityStatus, string> = {
  scheduled: "Dated in the future — no reconciliation expected yet.",
  incomplete: "Linked movements don't cover this activity's transactions yet.",
  completed: "Linked movements cover this activity's transactions.",
};

const ACTIVITY_STATUS_ALERT: Record<
  ActivityStatus,
  {
    icon: LucideIcon;
    className: string;
    iconClassName: string;
    descriptionClassName: string;
  }
> = {
  scheduled: {
    icon: CircleDashed,
    className: "border-border bg-muted/40 text-foreground",
    iconClassName: "text-muted-foreground",
    descriptionClassName: "text-muted-foreground",
  },
  incomplete: {
    icon: CircleDotDashed,
    className: "border-warning/60 bg-warning/15 text-foreground",
    iconClassName: "text-warning stroke-[2.25]",
    descriptionClassName: "text-foreground/90",
  },
  completed: {
    icon: CircleCheck,
    className: "border-primary/35 bg-primary/10 text-foreground",
    iconClassName: "text-primary",
    descriptionClassName: "text-muted-foreground",
  },
};

function ActivityStatusAlert({ status }: { status: ActivityStatus }) {
  const {
    icon: Icon,
    className,
    iconClassName,
    descriptionClassName,
  } = ACTIVITY_STATUS_ALERT[status];

  return (
    <Alert role="status" aria-live="polite" className={cn("mt-6", className)}>
      <Icon className={iconClassName} />
      <AlertTitle
        className={status === "incomplete" ? "font-semibold" : undefined}
      >
        {ACTIVITY_STATUS_NAME[status]}
      </AlertTitle>
      <AlertDescription className={descriptionClassName}>
        {ACTIVITY_STATUS_DESCRIPTION[status]}
      </AlertDescription>
    </Alert>
  );
}

interface ActivityPageProps {
  activityId: string;
  /** The transaction to focus, when the route links to one. */
  focusTransactionId?: string | null;
}

export function ActivityPage({
  activityId,
  focusTransactionId,
}: ActivityPageProps) {
  const router = useRouter();
  const mutate = useSync((state) => state.mutate);
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showSplitModal, setShowSplitModal] = React.useState(false);

  const activity = useActivities((state) => state.getActivityById(activityId));
  const activities = useActivities((state) => state.activities);

  // A depreciation-generated activity: read-only until explicitly
  // unlocked, since the schedule rewrites it on every change.
  const [unlocked, setUnlocked] = React.useState(false);
  const getDepreciationById = useAssetDepreciations(
    (state) => state.getDepreciationById,
  );
  const getAssetById = useAssets((state) => state.getAssetById);
  const schedule = activity?.depreciation
    ? getDepreciationById(activity.depreciation)
    : undefined;
  const depreciatedAsset = schedule ? getAssetById(schedule.asset) : undefined;
  const isGenerated = Boolean(activity?.depreciation);
  const isLocked = isGenerated && !unlocked;

  const breadcrumbs = usePageBreadcrumbs({
    contextual: true,
    routeKey: "/activities/$id",
    own: {
      key: `activity:${activityId}`,
      label: activity?.name ?? "",
      title: activity?.name,
      target: { to: "/activities/$id", params: { id: activityId } },
    },
    fallback: [
      { key: "activities", label: "Activities", target: { to: "/activities" } },
    ],
  });

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      void router.navigate({ to: "/activities" });
    }
  };

  const deleteActivity = () => {
    if (!activity) return;

    // Create a copy of the activity for rollback
    const activityToDelete = { ...activity };

    // Expected history: unlink entry on every linked movement's timeline
    const unlinkEvents = activity.movements
      .map((am) => {
        const movement = useMovements.getState().getMovementById(am.movement);
        return movement
          ? unlinkMovementHistoryEvent(
              movement,
              { id: activity.id, name: activity.name },
              am.amount,
            )
          : null;
      })
      .filter((event) => event !== null);

    mutate({
      name: "deleteActivity",
      mutation: deleteActivityMutation,
      variables: {
        id: activity.id,
      },
      rollbackData: activityToDelete,
      events: [
        {
          type: "deleteActivity",
          payload: {
            id: activity.id,
          },
        },
        ...unlinkEvents,
      ],
    });

    setShowDeleteModal(false);
    goBack();
  };

  const duplicateActivity = () => {
    if (!activity) return;

    const [duplicatedActivity] = duplicateActivities({
      activities: [activity],
    });

    mutate({
      name: "createActivity",
      mutation: createActivityMutation,
      variables: {
        ...duplicatedActivity,
        date: getGraphQLDate(duplicatedActivity.date),
      },
      rollbackData: undefined,
      events: [
        {
          type: "createActivity",
          payload: {
            ...duplicatedActivity,
            date: getGraphQLDate(duplicatedActivity.date),
          },
        },
        activityCreateHistoryEvent(duplicatedActivity.id),
      ],
    });

    void router.navigate({
      to: "/activities/$id",
      params: { id: duplicatedActivity.id },
    });
  };

  const updateActivity = (update: {
    name?: string;
    description?: string | null;
    date?: Date;
    category?: string | null;
    subcategory?: string | null;
    project?: string | null;
    users?: string[];
  }) => {
    if (!activity) return;

    // Create a copy of the current activity for rollback
    const oldActivity = { ...activity };

    const historyEvent = activityUpdateHistoryEvent(activity, update);

    mutate({
      name: "updateActivity",
      mutation: updateActivityMutation,
      variables: {
        id: activity.id,
        ...update,
        date: update.date ? getGraphQLDate(update.date) : undefined,
      },
      rollbackData: {
        ...oldActivity,
        date: getGraphQLDate(oldActivity.date),
      },
      events: [
        {
          type: "updateActivity",
          payload: {
            id: activity.id,
            ...update,
            date: update.date ? getGraphQLDate(update.date) : undefined,
          },
        },
        ...(historyEvent ? [historyEvent] : []),
      ],
    });
  };

  // Hotkeys to navigate between activities (same order as the activities table)
  const sortedActivities = React.useMemo(() => {
    return [...activities].sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [activities]);

  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    if (sortedActivities.length === 0) return;

    const currentIndex = sortedActivities.findIndex((a) => a.id === activityId);
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex - 1 + sortedActivities.length) %
          sortedActivities.length;

    void router.navigate({
      to: "/activities/$id",
      params: { id: sortedActivities[nextIndex].id },
      replace: true,
    });
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    if (sortedActivities.length === 0) return;

    const currentIndex = sortedActivities.findIndex((a) => a.id === activityId);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % sortedActivities.length;

    void router.navigate({
      to: "/activities/$id",
      params: { id: sortedActivities[nextIndex].id },
      replace: true,
    });
  });

  useHotkey("Escape", goBack);

  if (!activity) return null;

  return (
    <SidebarInset>
      <div className="flex h-full flex-col">
        <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="mr-1" />
          <PageBreadcrumbs entries={breadcrumbs} className="flex-1" />

          <div className="flex items-center justify-end gap-3">
            {isGenerated && !unlocked && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Unlock for editing"
                  >
                    <Lock />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Edit a depreciation activity?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This activity is generated by a depreciation schedule.
                      Hand edits are overwritten whenever the schedule changes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setUnlocked(true)}>
                      Unlock for editing
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <AlertDialog
              open={showDeleteModal}
              onOpenChange={setShowDeleteModal}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowSplitModal(true)}>
                    <Scissors />
                    Split
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={duplicateActivity}>
                    <Copy />
                    Duplicate
                  </DropdownMenuItem>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem variant="destructive">
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete activity</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this activity? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteActivity}
                    variant="destructive"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="mx-auto w-full max-w-5xl">
            <div className="border-b px-4 py-6 sm:px-8">
              <label htmlFor="date" className="sr-only">
                Date
              </label>
              {isLocked ? (
                <div className="px-0 py-0.5 font-normal text-muted-foreground">
                  {format(activity.date, "d MMMM yyyy")}
                </div>
              ) : (
                <DatePicker
                  id="date"
                  showIcon={false}
                  value={activity.date}
                  onChange={(date) => updateActivity({ date })}
                  className="h-auto border-0 bg-transparent px-0 py-0.5 font-normal text-muted-foreground hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
                />
              )}

              <div className="mt-1 flex items-baseline justify-between gap-4">
                {isLocked ? (
                  <div className="min-w-0 flex-1 px-0 py-0.5 text-3xl font-semibold md:text-3xl">
                    {activity.name}
                  </div>
                ) : (
                  <DebouncedInput
                    key={activity.id}
                    id="name"
                    aria-label="Activity name"
                    value={activity.name}
                    onCommit={(name) => updateActivity({ name })}
                    placeholder="Activity name"
                    className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0.5 text-3xl font-semibold md:text-3xl dark:bg-transparent"
                  />
                )}
                {Object.values(activity.amounts).every(
                  (amount) => amount === 0,
                ) ? (
                  <div className="font-mono text-2xl whitespace-nowrap tabular-nums">
                    <RollingAmount value={activity.amount} />
                  </div>
                ) : (
                  <ActivityAmountsValue
                    amounts={activity.amounts}
                    className="text-2xl"
                    animated
                  />
                )}
              </div>

              {isLocked ? (
                activity.description && (
                  <p className="mt-2 px-0 py-0.5 text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                )
              ) : (
                <DebouncedTextarea
                  key={activity.id}
                  id="description"
                  aria-label="Description"
                  value={activity.description || ""}
                  onCommit={(description) =>
                    updateActivity({ description: description || null })
                  }
                  placeholder="Add a description ..."
                  rows={1}
                  className="mt-2 min-h-16 w-full resize-none border-0 bg-transparent px-0 py-0.5 text-sm dark:bg-transparent"
                />
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isLocked ? (
                  <>
                    {activity.category &&
                      (() => {
                        const category = categories.find(
                          (c) => c.id === activity.category,
                        );
                        return category ? (
                          <Badge variant="outline" className="h-6">
                            {category.emoji && <span>{category.emoji}</span>}
                            {category.name}
                          </Badge>
                        ) : null;
                      })()}
                    {activity.subcategory &&
                      (() => {
                        const subcategory = subcategories.find(
                          (c) => c.id === activity.subcategory,
                        );
                        return subcategory ? (
                          <Badge variant="outline" className="h-6">
                            {subcategory.emoji && (
                              <span>{subcategory.emoji}</span>
                            )}
                            {subcategory.name}
                          </Badge>
                        ) : null;
                      })()}
                  </>
                ) : (
                  <>
                    <ActivityCategorySelect
                      value={activity.category || null}
                      onValueChange={(value) =>
                        updateActivity({ category: value, subcategory: null })
                      }
                      categories={categories}
                      placeholder="Category"
                    />
                    <ActivitySubcategorySelect
                      value={activity.subcategory}
                      onValueChange={(value) =>
                        updateActivity({ subcategory: value })
                      }
                      categoryId={activity.category}
                      subcategories={subcategories}
                    />
                    <ProjectSelect
                      value={activity.project}
                      onValueChange={(value) =>
                        updateActivity({ project: value })
                      }
                    />
                  </>
                )}
              </div>

              <ActivityStatusAlert status={activity.status} />
              {isGenerated && (
                <GeneratedActivityNotice
                  assetName={depreciatedAsset?.name}
                  assetId={schedule?.asset}
                />
              )}
            </div>

            {isLocked ? (
              <ReadOnlyTransactions activity={activity} />
            ) : (
              <ActivityTransactions
                activity={activity}
                focusTransactionId={focusTransactionId}
              />
            )}
            <ActivityMovements activity={activity} />
            <ActivitySharing activity={activity} />

            {activity.history.length > 0 && (
              <div className="px-4 py-6 sm:px-8">
                <HistoryTimeline
                  entityType="activity"
                  history={activity.history}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <SplitActivityModal
        open={showSplitModal}
        onOpenChange={setShowSplitModal}
        activityId={activity.id}
      />
    </SidebarInset>
  );
}

/**
 * The quiet banner marking a schedule-generated activity, with a way back
 * to the schedule it belongs to.
 */
function GeneratedActivityNotice({
  assetName,
  assetId,
}: {
  assetName: string | undefined;
  assetId: string | undefined;
}) {
  return (
    <Alert className="mt-6 border-border bg-muted/40 text-foreground">
      <TrendingDown className="text-muted-foreground" />
      <AlertTitle>Depreciation activity</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        Generated by {assetName ? `${assetName}'s` : "a"} depreciation schedule.
        Hand edits are overwritten whenever the schedule changes.{" "}
        {assetId && (
          <ContextLink
            to="/assets/$id"
            params={{ id: assetId }}
            className="font-medium text-foreground underline underline-offset-2"
          >
            View schedule
          </ContextLink>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * A generated activity's legs, as the ledger statement they are: no
 * selects, no editing — just what the schedule produced.
 */
function ReadOnlyTransactions({ activity }: { activity: Activity }) {
  const currencyFormatter = useCurrencyFormatter();

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="font-serif text-xl leading-none font-normal">
        Transactions
      </div>
      <div className="mt-4">
        {activity.transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex h-10 items-center gap-2 border-b text-sm last:border-b-0"
          >
            <AccountLabel accountId={transaction.fromAccount} />
            <MoveRight className="size-4 shrink-0 text-muted-foreground" />
            <AccountLabel accountId={transaction.toAccount} />
            <div className="flex-1" />
            <div className="font-mono whitespace-nowrap">
              {currencyFormatter.format(transaction.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
