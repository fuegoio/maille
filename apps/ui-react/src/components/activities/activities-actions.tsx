import { type Activity } from "@maille/core/activities";
import {
  Copy,
  Tag,
  TentTree,
  TextCursor,
  TextSelect,
  Trash2,
} from "lucide-react";
import * as React from "react";

import type { EntityAction } from "@/components/shared/entity-actions";

import { getGraphQLDate } from "@/lib/date";
import {
  activityCreateHistoryEvent,
  activityUpdateHistoryEvent,
  unlinkMovementHistoryEvent,
} from "@/lib/history-events";
import { duplicateActivities } from "@/logic/activities";
import {
  createActivityMutation,
  deleteActivityMutation,
  updateActivityMutation,
} from "@/mutations/activities";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";
import { useProjects } from "@/stores/projects";
import { useSync } from "@/stores/sync";

export function useActivitiesEntityActions(
  selectedActivityIds: string[],
  onClearSelection?: () => void,
): EntityAction[] {
  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const projects = useProjects((state) => state.projects);

  const selectedActivitiesData = React.useMemo(() => {
    return selectedActivityIds
      .map((id) => activities.find((a) => a.id === id))
      .filter(Boolean) as Activity[];
  }, [selectedActivityIds, activities]);

  const filteredSubcategories = React.useMemo(() => {
    if (selectedActivitiesData.length === 0) return [];
    const firstActivity = selectedActivitiesData[0];
    return subcategories.filter((sc) => sc.category === firstActivity.category);
  }, [selectedActivitiesData, subcategories]);

  const updateActivities = React.useCallback(
    (update: {
      name?: string;
      description?: string | null;
      date?: Date;
      category?: string | null;
      subcategory?: string | null;
      project?: string | null;
    }) => {
      selectedActivityIds.forEach((activityId) => {
        const activity = activities.find((a) => a.id === activityId);
        if (!activity) return;

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
      });
    },
    [selectedActivityIds, activities, mutate],
  );

  const duplicateActivitiesAction = React.useCallback(() => {
    const duplicated = duplicateActivities({
      activities: selectedActivitiesData,
    });

    duplicated.forEach((duplicatedActivity) => {
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
    });
  }, [selectedActivitiesData, mutate]);

  const deleteActivities = React.useCallback(() => {
    selectedActivityIds.forEach((activityId) => {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      const activityToDelete = { ...activity };
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
        variables: { id: activity.id },
        rollbackData: activityToDelete,
        events: [
          { type: "deleteActivity", payload: { id: activity.id } },
          ...unlinkEvents,
        ],
      });
    });
  }, [selectedActivityIds, activities, mutate]);

  return React.useMemo(() => {
    const clearAndComplete = () => {
      onClearSelection?.();
    };

    return [
      {
        value: "name",
        label: "Set new name",
        icon: <TextCursor />,
        type: "input" as const,
        placeholder: "Enter new name...",
        defaultValue: selectedActivitiesData[0]?.name || "",
        shortcut: "N",
        action: (value?: string) => {
          if (value && value.trim()) {
            updateActivities({ name: value });
          }
          clearAndComplete();
        },
      },
      {
        value: "description",
        label: "Set new description",
        icon: <TextSelect />,
        type: "input" as const,
        placeholder: "Enter new description...",
        defaultValue: selectedActivitiesData[0]?.description || "",
        shortcut: "D",
        action: (value?: string) => {
          updateActivities({ description: value || null });
          clearAndComplete();
        },
      },
      {
        value: "category",
        label: "Change category",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "Y",
        getValues: () => [
          ...categories.map((category) => ({
            value: `category-${category.id}`,
            label: category.name,
            icon: category.emoji ? <span>{category.emoji}</span> : null,
            action: () => {
              updateActivities({ category: category.id, subcategory: null });
              clearAndComplete();
            },
          })),
          {
            value: "category-none",
            label: "No Category",
            icon: null,
            action: () => {
              updateActivities({ category: null, subcategory: null });
              clearAndComplete();
            },
          },
        ],
      },
      {
        value: "subcategory",
        label: "Change subcategory",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "S",
        getValues: () => [
          ...filteredSubcategories.map((subcategory) => ({
            value: `subcategory-${subcategory.id}`,
            label: subcategory.name,
            icon: subcategory.emoji ? <span>{subcategory.emoji}</span> : null,
            action: () => {
              updateActivities({ subcategory: subcategory.id });
              clearAndComplete();
            },
          })),
          {
            value: "subcategory-none",
            label: "No Subcategory",
            icon: null,
            action: () => {
              updateActivities({ subcategory: null });
              clearAndComplete();
            },
          },
        ],
      },
      {
        value: "project",
        label: "Add to project",
        icon: <TentTree />,
        type: "select" as const,
        shortcut: "P",
        getValues: () => [
          ...projects.map((project) => ({
            value: `project-${project.id}`,
            label: project.name,
            icon: project.emoji ? <span>{project.emoji}</span> : null,
            action: () => {
              updateActivities({ project: project.id });
              clearAndComplete();
            },
          })),
          {
            value: "project-none",
            label: "No Project",
            icon: null,
            action: () => {
              updateActivities({ project: null });
              clearAndComplete();
            },
          },
        ],
      },
      {
        value: "duplicate",
        label: "Duplicate",
        icon: <Copy />,
        type: null,
        shortcut: "C",
        action: () => {
          duplicateActivitiesAction();
          clearAndComplete();
        },
      },
      {
        value: "delete",
        label: "Delete",
        icon: <Trash2 />,
        type: null,
        shortcut: "Del",
        variant: "destructive" as const,
        action: () => {
          deleteActivities();
          clearAndComplete();
        },
      },
    ];
  }, [
    selectedActivitiesData,
    categories,
    filteredSubcategories,
    projects,
    updateActivities,
    duplicateActivitiesAction,
    deleteActivities,
    onClearSelection,
  ]);
}
