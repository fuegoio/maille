import { ActivityType, type Activity } from "@maille/core/activities";
import { ChevronRight, Trash2, Scissors } from "lucide-react";
import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrencyFormatter } from "@/lib/utils";
import {
  updateActivityMutation,
  deleteActivityMutation,
} from "@/mutations/activities";
import { useActivities } from "@/stores/activities";
import { useSync } from "@/stores/sync";

import { SidebarInset } from "../ui/sidebar";

import { ActivityLiabilities } from "./activity-liabilities";
import { ActivityMovements } from "./activity-movements";
import { ActivityTransactions } from "./activity-transactions";
import { SplitActivityModal } from "./split-activity-modal";

export function Activity() {
  const setFocusedActivity = useActivities((state) => state.setFocusedActivity);
  const mutate = useSync((state) => state.mutate);

  const [showProperties, setShowProperties] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showSplitModal, setShowSplitModal] = React.useState(false);

  const activity = useActivities((state) => {
    if (!state.focusedActivity) return null;
    return state.getActivityById(state.focusedActivity);
  });

  const currencyFormatter = getCurrencyFormatter();

  const close = () => {
    setFocusedActivity(null);
  };

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

    close();
    setShowDeleteModal(false);
  };

  const updateActivity = (update: {
    name?: string;
    description?: string | null;
    date?: Date;
    type?: ActivityType;
    category?: string | null;
    subcategory?: string | null;
    project?: string | null;
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
        date: update.date?.toISOString(),
      },
      rollbackData: {
        ...oldActivity,
        date: oldActivity.date.toISOString(),
      },
      events: [
        {
          type: "updateActivity",
          payload: {
            id: activity.id,
            ...update,
            date: update.date?.toISOString(),
          },
        },
      ],
    });
  };

  // Hotkey to close with Escape
  useHotkeys("escape", () => {
    close();
  });

  if (!activity) return null;

  return (
    <SidebarInset className="max-w-lg">
      <div className="flex h-full flex-col">
        <div className="flex h-12 w-full shrink-0 items-center border-b px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 ml-8 inline-flex h-8 w-6 items-center justify-center lg:ml-0"
            onClick={close}
          >
            <ChevronRight className="text-primary-100 h-5 w-5 transition hover:text-white" />
          </Button>
          <div className="font-medium">Activity #{activity.number}</div>

          <div className="flex-1" />

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex h-8 w-6 items-center justify-center"
              onClick={() => setShowSplitModal(true)}
            >
              <Scissors className="text-primary-100 h-5 w-5 transition hover:text-white" />
            </Button>

            <AlertDialog
              open={showDeleteModal}
              onOpenChange={setShowDeleteModal}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="inline-flex h-8 w-6 items-center justify-center"
                >
                  <Trash2 className="text-primary-100 h-5 w-5 transition hover:text-white" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-primary-900 border-primary-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Delete Activity
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-primary-100">
                    Are you sure you want to delete this activity? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-primary-800 border-primary-700 hover:bg-primary-700 text-white">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteActivity}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="border-b px-4 py-8 sm:px-8">
            <div
              className={`-ml-2 flex h-7 w-fit items-center rounded-md px-3 ${
                activity.status === "scheduled"
                  ? "bg-primary-700"
                  : activity.status === "incomplete"
                    ? "bg-orange-300"
                    : "bg-emerald-300"
              }`}
            >
              <span className="text-primary-800 text-sm font-medium capitalize">
                {activity.status}
              </span>
            </div>

            <div className="mt-4 flex items-start">
              <div className="flex-1">
                <Input
                  type="date"
                  value={activity.date.toISOString().split("T")[0]}
                  onChange={(e) =>
                    updateActivity({ date: new Date(e.target.value) })
                  }
                  className="text-primary-100 h-8 border-none bg-transparent text-sm font-semibold"
                />
                <div className="flex items-start">
                  <Input
                    value={activity.name}
                    onChange={(e) => updateActivity({ name: e.target.value })}
                    className="flex-1 border-none bg-transparent text-lg font-medium text-white"
                  />
                  <div className="flex-1" />
                  <div className="pl-4 text-right font-mono text-3xl leading-snug font-semibold whitespace-nowrap text-white">
                    {currencyFormatter.format(activity.amount)}
                  </div>
                </div>

                <Textarea
                  value={activity.description || ""}
                  onChange={(e) =>
                    updateActivity({ description: e.target.value || null })
                  }
                  className="text-primary-100 placeholder:text-primary-700 mt-2 w-full resize-none border-none bg-transparent text-sm break-words"
                  placeholder="Add a description ..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="border-b px-4 py-6 sm:px-8">
            <div className="flex">
              <button
                className="text-primary-100 -ml-2 flex h-7 items-center rounded px-2 text-sm font-medium transition-colors hover:text-white"
                onClick={() => setShowProperties(!showProperties)}
              >
                Properties
                {showProperties ? (
                  <ChevronRight className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-2 h-4 w-4 rotate-90 transform" />
                )}
              </button>
            </div>

            {showProperties && (
              <div className="pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm">Activity type</div>
                  {/* Activity type selector would go here */}
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm">Category</div>
                  {/* Category selector would go here */}
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm">Subcategory</div>
                  {/* Subcategory selector would go here */}
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm">Project</div>
                  {/* Project selector would go here */}
                </div>
              </div>
            )}
          </div>

          <ActivityTransactions activity={activity} />
          <ActivityMovements activity={activity} />
          <ActivityLiabilities activity={activity} />
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
