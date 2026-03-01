import { ActivityType, type Activity } from "@maille/core/activities";
import {
  ArrowRightLeft,
  Tag,
  TentTree,
  TextCursor,
  TextSelect,
  Trash2,
} from "lucide-react";
import * as React from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { getGraphQLDate } from "@/lib/date";
import {
  deleteActivityMutation,
  updateActivityMutation,
} from "@/mutations/activities";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useProjects } from "@/stores/projects";
import { useSync } from "@/stores/sync";

interface ActivitiesCommandPaletteProps {
  selectedActivities: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivitiesCommandPalette({
  selectedActivities,
  open,
  onOpenChange,
}: ActivitiesCommandPaletteProps) {
  const [search, setSearch] = React.useState("");
  const [step, setStep] = React.useState<"action" | "value" | "input">(
    "action",
  );
  const [selectedAction, setSelectedAction] = React.useState<string | null>(
    null,
  );
  const [inputValue, setInputValue] = React.useState("");

  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);
  const categories = useActivities((state) => state.activityCategories);
  const subcategories = useActivities((state) => state.activitySubcategories);
  const projects = useProjects((state) => state.projects);

  const selectedActivityIds = React.useMemo(() => {
    return selectedActivities.length > 0
      ? selectedActivities
      : useActivities.getState().focusedActivity
        ? [useActivities.getState().focusedActivity]
        : [];
  }, [selectedActivities]);

  const selectedActivitiesData = React.useMemo(() => {
    return selectedActivityIds
      .map((id) => activities.find((a) => a.id === id))
      .filter(Boolean) as Activity[];
  }, [selectedActivityIds, activities]);

  const filteredCategories = React.useMemo(() => {
    if (selectedActivitiesData.length === 0) return categories;
    const firstActivity = selectedActivitiesData[0];
    return categories.filter((c) => c.type === firstActivity.type);
  }, [selectedActivitiesData, categories]);

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
      type?: ActivityType;
      category?: string | null;
      subcategory?: string | null;
      project?: string | null;
    }) => {
      selectedActivityIds.forEach((activityId) => {
        const activity = activities.find((a) => a.id === activityId);
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
      });
    },
    [selectedActivityIds, activities, mutate],
  );

  const deleteActivities = React.useCallback(() => {
    selectedActivityIds.forEach((activityId) => {
      const activity = activities.find((a) => a.id === activityId);
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
    });
  }, [selectedActivityIds, activities, mutate]);

  // Action definitions
  const actionDefinitions = React.useMemo(() => {
    const actions = [
      {
        value: "name",
        label: "Set new name",
        icon: <TextCursor />,
        type: "input" as const,
        placeholder: "Enter new name...",
        defaultValue: selectedActivitiesData[0]?.name || "",
        shortcut: "N",
        action: (value: string) => {
          if (value.trim()) {
            updateActivities({ name: value });
          }
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
        action: (value: string) => {
          updateActivities({ description: value || null });
        },
      },
      {
        value: "type",
        label: "Change activity type",
        icon: <ArrowRightLeft />,
        type: "select" as const,
        shortcut: "T",
        getValues: () => {
          return Object.values(ActivityType).map((activityType) => ({
            value: `type-${activityType}`,
            label: ACTIVITY_TYPES_NAME[activityType],
            icon: (
              <div
                className={`h-4 w-4 rounded-full ${ACTIVITY_TYPES_COLOR[activityType]}`}
              />
            ),
            action: () => {
              updateActivities({
                type: activityType,
                category: null,
                subcategory: null,
              });
            },
          }));
        },
      },
      {
        value: "category",
        label: "Change category",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "Y",
        getValues: () => {
          return [
            ...filteredCategories.map((category) => ({
              value: `category-${category.id}`,
              label: category.name,
              icon: category.emoji ? <span>{category.emoji}</span> : null,
              action: () => {
                updateActivities({ category: category.id, subcategory: null });
              },
            })),
            {
              value: "category-none",
              label: "No Category",
              icon: null,
              action: () => {
                updateActivities({ category: null, subcategory: null });
              },
            },
          ];
        },
      },
      {
        value: "subcategory",
        label: "Change subcategory",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "S",
        getValues: () => {
          return [
            ...filteredSubcategories.map((subcategory) => ({
              value: `subcategory-${subcategory.id}`,
              label: subcategory.name,
              icon: subcategory.emoji ? <span>{subcategory.emoji}</span> : null,
              action: () => {
                updateActivities({ subcategory: subcategory.id });
              },
            })),
            {
              value: "subcategory-none",
              label: "No Subcategory",
              icon: null,
              action: () => {
                updateActivities({ subcategory: null });
              },
            },
          ];
        },
      },
      {
        value: "project",
        label: "Add to project",
        icon: <TentTree />,
        type: "select" as const,
        shortcut: "P",
        getValues: () => {
          return [
            ...projects.map((project) => ({
              value: `project-${project.id}`,
              label: project.name,
              icon: project.emoji ? <span>{project.emoji}</span> : null,
              action: () => {
                updateActivities({ project: project.id });
              },
            })),
            {
              value: "project-none",
              label: "No Project",
              icon: null,
              action: () => {
                updateActivities({ project: null });
              },
            },
          ];
        },
      },
      {
        value: "delete",
        label: "Delete",
        icon: <Trash2 />,
        type: null,
        shortcut: "Del",
        action: () => {
          deleteActivities();
        },
      },
    ];
    return actions;
  }, [
    selectedActivitiesData,
    filteredCategories,
    filteredSubcategories,
    projects,
    updateActivities,
    deleteActivities,
  ]);

  const filteredActions = React.useMemo(() => {
    if (!search) return actionDefinitions;
    return actionDefinitions.filter((action) =>
      action.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, actionDefinitions]);

  // Get values for the selected action
  const actionValues = React.useMemo(() => {
    if (!selectedAction) return [];
    const action = actionDefinitions.find((a) => a.value === selectedAction);
    return action && action.type === "select" ? action.getValues() : [];
  }, [selectedAction, actionDefinitions]);

  // Filtered values based on search
  const filteredValues = React.useMemo(() => {
    if (!search) return actionValues;
    return actionValues.filter((value) =>
      value.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, actionValues]);

  const handleActionSelect = (actionValue: string) => {
    const action = actionDefinitions.find((a) => a.value === actionValue);
    if (action) {
      if (action.type === "input") {
        setSelectedAction(actionValue);
        setStep("input");
        setInputValue(action.defaultValue || "");
      } else if (action.type === "select") {
        setSelectedAction(actionValue);
        setStep("value");
        setSearch("");
      } else if (!action.type) {
        action.action();
        onOpenChange(false);
        setStep("action");
        setSelectedAction(null);
        setSearch("");
      }
    }
  };

  const handleInputSubmit = () => {
    if (selectedAction && inputValue !== null) {
      const action = actionDefinitions.find((a) => a.value === selectedAction);
      if (action && action.type === "input") {
        action.action(inputValue);
        onOpenChange(false);
        setStep("action");
        setSelectedAction(null);
        setInputValue("");
        setSearch("");
      }
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command shouldFilter={false}>
        {step === "input" ? (
          <div className="flex items-center">
            <CommandInput
              placeholder={
                actionDefinitions.find((a) => a.value === selectedAction)
                  ?.placeholder || "Enter value..."
              }
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInputSubmit();
                }
              }}
            />
            <CommandShortcut className="mr-2 text-sm">Enter</CommandShortcut>
          </div>
        ) : (
          <>
            <CommandInput
              placeholder={
                step === "action"
                  ? `Type a command or search...`
                  : `Search ${selectedAction}...`
              }
              value={search}
              onValueChange={setSearch}
            />
            <div className="h-px w-full bg-border" />
          </>
        )}

        <CommandList>
          {step === "action" && (
            <>
              <CommandEmpty>No actions found.</CommandEmpty>
              <CommandGroup
                heading={`${selectedActivitiesData.length} activit${selectedActivitiesData.length > 1 ? "ies" : "y"} selected`}
              >
                {filteredActions.map((action) => (
                  <CommandItem
                    key={action.value}
                    value={action.value}
                    onSelect={() => handleActionSelect(action.value)}
                  >
                    {action.icon}
                    {action.label}
                    <CommandShortcut>{action.shortcut}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {step === "value" && (
            <>
              <CommandEmpty>No values found.</CommandEmpty>
              <CommandGroup
                heading={
                  actionDefinitions.find((a) => a.value === selectedAction)
                    ?.label
                }
              >
                {filteredValues.map((value) => (
                  <CommandItem
                    key={value.value}
                    value={value.value}
                    onSelect={() => {
                      value.action();
                      onOpenChange(false);
                      setStep("action");
                      setSelectedAction(null);
                      setSearch("");
                    }}
                  >
                    {value.icon}
                    {value.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
