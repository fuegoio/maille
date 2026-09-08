import { ActivityType, type ActivityStatus } from "@maille/core/activities";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Link, useRouter } from "@tanstack/react-router";
import {
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  Copy,
  Ellipsis,
  Scissors,
  Trash2,
} from "lucide-react";
import * as React from "react";

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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { duplicateActivities } from "@/logic/activities";
import {
  createActivityMutation,
  updateActivityMutation,
  deleteActivityMutation,
} from "@/mutations/activities";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useSync } from "@/stores/sync";

import { ProjectSelect } from "../projects/project-select";
import { DatePicker } from "../ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import { ActivityCategorySelect } from "./activity-category-select";
import { ActivityMovements } from "./activity-movements";
import { ActivitySharing } from "./activity-sharing";
import { ActivitySubcategorySelect } from "./activity-subcategory-select";
import { ActivityTransactions } from "./activity-transactions";
import { SplitActivityModal } from "./split-activity-modal";

const ACTIVITY_STATUS_NAME: Record<ActivityStatus, string> = {
  scheduled: "Scheduled",
  incomplete: "To reconciliate",
  completed: "Reconciled",
};

const ACTIVITY_STATUS_DESCRIPTION: Record<ActivityStatus, string> = {
  scheduled: "Dated in the future — no reconciliation expected yet.",
  incomplete: "Linked movements don't cover this activity's transactions yet.",
  completed: "Linked movements cover this activity's transactions.",
};

function ActivityStatusMark({ status }: { status: ActivityStatus }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {status === "scheduled" ? (
        <CircleDashed className="size-5 shrink-0 text-muted-foreground" />
      ) : status === "incomplete" ? (
        <CircleDotDashed className="size-5 shrink-0 text-orange-300" />
      ) : (
        <CircleCheck className="size-5 shrink-0 text-indigo-300" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium">
          {ACTIVITY_STATUS_NAME[status]}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {ACTIVITY_STATUS_DESCRIPTION[status]}
        </div>
      </div>
    </div>
  );
}

interface ActivityPageProps {
  activityId: string;
}

export function ActivityPage({ activityId }: ActivityPageProps) {
  const router = useRouter();
  const mutate = useSync((state) => state.mutate);
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showSplitModal, setShowSplitModal] = React.useState(false);

  const activity = useActivities((state) => state.getActivityById(activityId));
  const activities = useActivities((state) => state.activities);

  const filteredCategories = React.useMemo(() => {
    if (!activity?.type) return categories;
    return categories.filter((c) => c.type === activity.type);
  }, [activity?.type, categories]);

  const currencyFormatter = useCurrencyFormatter();

  const deleteActivity = () => {
    if (!activity) return;

    // Create a copy of the activity for rollback
    const activityToDelete = { ...activity };

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
      ],
    });

    setShowDeleteModal(false);
    void router.navigate({ to: "/activities" });
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
    type?: ActivityType;
    category?: string | null;
    subcategory?: string | null;
    project?: string | null;
    users?: string[];
  }) => {
    if (!activity) return;

    // Create a copy of the current activity for rollback
    const oldActivity = { ...activity };

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

  if (!activity) return null;

  return (
    <SidebarInset>
      <div className="flex h-full flex-col">
        <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="mr-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/activities">Activities</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-48 truncate">
                  {activity.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex-1" />

          <div className="flex items-center justify-end gap-3">
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
          <div className="mx-auto w-full max-w-3xl">
            <div className="border-b px-4 py-6 sm:px-8">
              <label htmlFor="date" className="sr-only">
                Date
              </label>
              <DatePicker
                id="date"
                showIcon={false}
                value={activity.date}
                onChange={(date) => updateActivity({ date })}
                className="h-auto border-0 bg-transparent px-0 py-0.5 font-normal text-muted-foreground hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
              />

              <Input
                id="name"
                aria-label="Activity name"
                value={activity.name}
                onChange={(e) => updateActivity({ name: e.target.value })}
                placeholder="Activity name"
                className="mt-1 h-auto w-full border-0 bg-transparent px-0 py-0.5 text-3xl font-semibold md:text-3xl dark:bg-transparent"
              />

              <Textarea
                id="description"
                aria-label="Description"
                value={activity.description || ""}
                onChange={(e) =>
                  updateActivity({ description: e.target.value || null })
                }
                placeholder="Add a description ..."
                rows={1}
                className="mt-2 min-h-0 w-full resize-none border-0 bg-transparent px-0 py-0.5 text-sm dark:bg-transparent"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Select
                  value={activity.type}
                  onValueChange={(value) =>
                    updateActivity({
                      type: value as ActivityType,
                      category: null,
                      subcategory: null,
                    })
                  }
                >
                  <SelectTrigger id="type" aria-label="Activity type">
                    <SelectValue placeholder="Activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ActivityType).map((activityType) => (
                      <SelectItem key={activityType} value={activityType}>
                        <div className="flex items-center py-1">
                          <div
                            className={cn(
                              "mr-2 h-3 w-3 rounded-full",
                              ACTIVITY_TYPES_COLOR[activityType],
                            )}
                          />
                          <span>{ACTIVITY_TYPES_NAME[activityType]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ActivityCategorySelect
                  value={activity.category || null}
                  onValueChange={(value) =>
                    updateActivity({ category: value, subcategory: null })
                  }
                  type={activity.type}
                  categories={filteredCategories}
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
                  onValueChange={(value) => updateActivity({ project: value })}
                />
              </div>

              <div className="-mx-4 mt-6 flex items-center justify-between gap-4 border-t px-4 pt-4 sm:-mx-8 sm:px-8">
                <ActivityStatusMark status={activity.status} />
                <div className="font-mono text-2xl leading-snug font-semibold whitespace-nowrap">
                  {currencyFormatter.format(activity.amount)}
                </div>
              </div>
            </div>

            <ActivityTransactions activity={activity} />
            <ActivityMovements activity={activity} />
            <ActivitySharing activity={activity} />
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
