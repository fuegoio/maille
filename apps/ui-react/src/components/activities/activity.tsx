import * as React from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { activitiesStore } from "@/stores/activities";
import { viewsStore } from "@/stores/views";
import { eventsStore } from "@/stores/events";
import { updateActivityMutation, deleteActivityMutation } from "@/mutations/activities";
import { ActivityType, type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Trash2, Scissors } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { ActivityTransactions } from "./activity-transactions";
import { ActivityMovements } from "./activity-movements";
import { ActivityLiabilities } from "./activity-liabilities";
import { SplitActivityModal } from "./split-activity-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { UUID } from "crypto";



interface ActivityProps {
  viewId: string;
}

export function Activity({ viewId }: ActivityProps) {
  const activityView = useStore(viewsStore, (state) => state.getActivityView(viewId));
  const { activities } = useStore(
    activitiesStore,
    useShallow((state) => ({
      activities: state.activities,
    }))
  );

  const [showProperties, setShowProperties] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showSplitModal, setShowSplitModal] = React.useState(false);

  const activity = React.useMemo(() => {
    if (!activityView.focusedActivity) return null;
    return activitiesStore.getState().getActivityById(activityView.focusedActivity as UUID);
  }, [activityView.focusedActivity, activities]);

  const currencyFormatter = getCurrencyFormatter();

  const close = () => {
    activityView.focusedActivity = null;
  };



  const deleteActivity = () => {
    if (!activity) return;

    // Create a copy of the activity for rollback
    const activityToDelete = { ...activity };

    activitiesStore.getState().deleteActivity(activity.id);

    eventsStore.getState().sendEvent({
      name: "deleteActivity",
      mutation: deleteActivityMutation,
      variables: {
        id: activity.id,
      },
      rollbackData: activityToDelete,
    });

    close();
    setShowDeleteModal(false);
  };

  const updateActivity = (update: {
    name?: string;
    description?: string | null;
    date?: Date;
    type?: ActivityType;
    category?: UUID | null;
    subcategory?: UUID | null;
    project?: UUID | null;
  }) => {
    if (!activity) return;
    
    // Create a copy of the current activity for rollback
    const oldActivity = { ...activity };
    
    activitiesStore.getState().updateActivity(activity.id, update);

    eventsStore.getState().sendEvent({
      name: "updateActivity",
      mutation: updateActivityMutation,
      variables: {
        id: activity.id,
        ...update,
        date: update.date?.toISOString(),
      },
      rollbackData: {
        id: activity.id,
        name: oldActivity.name,
        description: oldActivity.description,
        date: oldActivity.date.toISOString(),
        type: oldActivity.type,
        category: oldActivity.category,
        subcategory: oldActivity.subcategory,
        project: oldActivity.project,
      },
    });
  };

  // Hotkey to close with Escape
  useHotkeys("escape", () => {
    close();
  });

  if (!activity) return null;

  return (
    <Sheet open={!!activity} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="w-full @5xl:w-[575px] max-w-full h-full overflow-hidden border bg-primary-900 shadow-xl rounded"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center px-4 sm:px-6 border-b w-full flex-shrink-0 h-14">
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex items-center justify-center w-6 h-8 ml-8 lg:ml-0 mr-4"
              onClick={close}
            >
              <ChevronRight className="h-5 w-5 transition text-primary-100 hover:text-white" />
            </Button>
            <div className="text-white text-sm font-medium">
              Activity #{activity.number}
            </div>

            <div className="flex-1 block sm:hidden" />

            <div className="flex items-center gap-2 ml-auto mr-3">
              <Button
                variant="ghost"
                size="icon"
                className="inline-flex items-center justify-center w-6 h-8 sm:hidden"
                onClick={() => setShowSplitModal(true)}
              >
                <Scissors className="h-5 w-5 transition text-primary-100 hover:text-white" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="inline-flex items-center justify-center w-6 h-8 sm:hidden"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-5 w-5 transition text-primary-100 hover:text-white" />
              </Button>

              <div className="hidden sm:flex items-center justify-end gap-3 mr-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="inline-flex items-center justify-center w-6 h-8"
                  onClick={() => setShowSplitModal(true)}
                >
                  <Scissors className="h-5 w-5 transition text-primary-100 hover:text-white" />
                </Button>

                <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="inline-flex items-center justify-center w-6 h-8"
                    >
                      <Trash2 className="h-5 w-5 transition text-primary-100 hover:text-white" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-primary-900 border-primary-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Activity</AlertDialogTitle>
                      <AlertDialogDescription className="text-primary-100">
                        Are you sure you want to delete this activity? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-primary-800 border-primary-700 text-white hover:bg-primary-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteActivity}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">
            <div className="py-8 px-4 sm:px-8 border-b">
              <div
                className={`flex items-center px-3 rounded-md w-fit h-7 -ml-2 ${
                  activity.status === "scheduled"
                    ? "bg-primary-700"
                    : activity.status === "incomplete"
                    ? "bg-orange-300"
                    : "bg-emerald-300"
                }`}
              >
                <span className="capitalize text-sm font-medium text-primary-800">
                  {activity.status}
                </span>
              </div>

              <div className="flex items-start mt-4">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={activity.date.toISOString().split("T")[0]}
                    onChange={(e) => 
                      updateActivity({ date: new Date(e.target.value) })
                    }
                    className="font-semibold text-primary-100 text-sm h-8 border-none bg-transparent"
                  />
                  <div className="flex items-start">
                    <Input
                      value={activity.name}
                      onChange={(e) => updateActivity({ name: e.target.value })}
                      className="border-none text-lg font-medium bg-transparent text-white flex-1"
                    />
                    <div className="flex-1" />
                    <div className="font-semibold text-white text-right text-3xl pl-4 leading-snug whitespace-nowrap font-mono">
                      {currencyFormatter.format(activity.amount)}
                    </div>
                  </div>

                  <Textarea
                    value={activity.description || ""}
                    onChange={(e) => 
                      updateActivity({ description: e.target.value || null })
                    }
                    className="mt-2 text-sm border-none w-full text-primary-100 break-words resize-none bg-transparent placeholder:text-primary-700"
                    placeholder="Add a description ..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="py-6 px-4 sm:px-8 border-b">
              <div className="flex">
                <button
                  className="-ml-2 text-sm font-medium text-primary-100 px-2 rounded h-7 hover:text-white flex items-center transition-colors"
                  onClick={() => setShowProperties(!showProperties)}
                >
                  Properties
                  {showProperties ? (
                    <ChevronRight className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronRight className="ml-2 h-4 w-4 transform rotate-90" />
                  )}
                </button>
              </div>

              {showProperties && (
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm">Activity type</div>
                    {/* Activity type selector would go here */}
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm">Category</div>
                    {/* Category selector would go here */}
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm">Subcategory</div>
                    {/* Subcategory selector would go here */}
                  </div>

                  <div className="flex justify-between items-center mb-2">
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
      </SheetContent>

      <SplitActivityModal
        open={showSplitModal}
        onOpenChange={setShowSplitModal}
        activityId={activity.id}
      />
    </Sheet>
  );
}