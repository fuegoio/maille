import { ActivityType, type Activity } from "@maille/core/activities";
import { useHotkey } from "@tanstack/react-hotkeys";
import { ChevronRight, Trash2, Scissors } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getGraphQLDate } from "@/lib/date";
import { cn, getCurrencyFormatter } from "@/lib/utils";
import {
  updateActivityMutation,
  deleteActivityMutation,
} from "@/mutations/activities";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useSync } from "@/stores/sync";

import { DatePicker } from "../ui/date-picker";
import { Field, FieldGroup, FieldLabel, FieldSet } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SidebarInset } from "../ui/sidebar";
import { UserMultiSelect } from "../users/user-multi-select";

import { ActivityLiabilities } from "./activity-liabilities";
import { ActivityMovements } from "./activity-movements";
import { ActivityTransactions } from "./activity-transactions";
import { SplitActivityModal } from "./split-activity-modal";

export function Activity() {
  const setFocusedActivity = useActivities((state) => state.setFocusedActivity);
  const mutate = useSync((state) => state.mutate);
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showSplitModal, setShowSplitModal] = React.useState(false);

  const activity = useActivities((state) => {
    if (!state.focusedActivity) return null;
    return state.getActivityById(state.focusedActivity);
  });

  const filteredCategories = React.useMemo(() => {
    if (!activity?.type) return categories;
    return categories.filter((c) => c.type === activity.type);
  }, [activity?.type, categories]);

  const filteredSubcategories = React.useMemo(() => {
    if (!activity?.category) return [];
    return subcategories.filter((sc) => sc.category === activity.category);
  }, [activity?.category, subcategories]);

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

  // Hotkey to close with Escape
  useHotkey("Escape", () => {
    close();
  });

  if (!activity) return null;

  return (
    <SidebarInset className="max-w-xl">
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
              onClick={() => setShowSplitModal(true)}
            >
              <Scissors />
            </Button>

            <AlertDialog
              open={showDeleteModal}
              onOpenChange={setShowDeleteModal}
            >
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
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
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="border-b px-4 py-8 sm:px-8">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex h-7 w-fit items-center rounded-md border px-3",
                  {
                    "bg-muted": activity.status === "scheduled",
                    "bg-orange-400": activity.status === "incomplete",
                    "bg-indigo-400": activity.status === "completed",
                  },
                )}
              >
                <span className="text-sm font-medium text-white capitalize">
                  {activity.status}
                </span>
              </div>

              <div className="pl-4 text-right font-mono text-2xl leading-snug font-semibold whitespace-nowrap text-white">
                {currencyFormatter.format(activity.amount)}
              </div>
            </div>

            <FieldSet className="mt-8">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="date">Date</FieldLabel>
                  <DatePicker
                    value={activity.date}
                    id="date"
                    onChange={(date) => updateActivity({ date })}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="name">Activity name</FieldLabel>
                  <Input
                    id="name"
                    value={activity.name}
                    onChange={(e) => updateActivity({ name: e.target.value })}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    value={activity.description || ""}
                    onChange={(e) =>
                      updateActivity({ description: e.target.value || null })
                    }
                    className="resize-none"
                    placeholder="Add a description ..."
                    rows={3}
                  />
                </Field>
              </FieldGroup>

              <FieldGroup className="mt-2 gap-3">
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="type">Activity type</FieldLabel>
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
                    <SelectTrigger id="type">
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
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Select
                    value={activity.category || undefined}
                    onValueChange={(value) =>
                      updateActivity({ category: value, subcategory: null })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="subcategory">Subcategory</FieldLabel>
                  <Select
                    value={activity.subcategory || undefined}
                    onValueChange={(value) =>
                      updateActivity({ subcategory: value })
                    }
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubcategories.map((subcat) => (
                        <SelectItem key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="users">Users</FieldLabel>
                  <UserMultiSelect
                    value={activity.users}
                    onChange={(value) => updateActivity({ users: value })}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
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
