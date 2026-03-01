import { ActivityType, type Activity } from "@maille/core/activities";
import { useHotkey } from "@tanstack/react-hotkeys";
import * as React from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getGraphQLDate } from "@/lib/date";
import { updateActivityMutation } from "@/mutations/activities";
import {
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
  useActivities,
} from "@/stores/activities";
import { useProjects } from "@/stores/projects";
import { useSync } from "@/stores/sync";

interface ActivitiesCommandPaletteProps {
  selectedActivities: string[];
}

export function ActivitiesCommandPalette({
  selectedActivities,
}: ActivitiesCommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
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

  // Action definitions
  const actionDefinitions = React.useMemo(() => {
    const actions = [
      {
        value: "name",
        label: "Change Name",
        icon: null,
        type: "input" as const,
        placeholder: "Enter new name...",
        defaultValue: selectedActivitiesData[0]?.name || "",
        action: (value: string) => {
          if (value.trim()) {
            updateActivities({ name: value });
          }
        },
      },
      {
        value: "description",
        label: "Change Description",
        icon: null,
        type: "input" as const,
        placeholder: "Enter new description...",
        defaultValue: selectedActivitiesData[0]?.description || "",
        action: (value: string) => {
          updateActivities({ description: value || null });
        },
      },
      {
        value: "type",
        label: "Change Activity Type",
        icon: null,
        type: "select" as const,
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
        label: "Change Category",
        icon: null,
        type: "select" as const,
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
        label: "Change Subcategory",
        icon: null,
        type: "select" as const,
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
        label: "Change Project",
        icon: null,
        type: "select" as const,
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
    ];

    return actions.filter((action) => {
      if (!search) return true;
      return action.label.toLowerCase().includes(search.toLowerCase());
    });
  }, [
    selectedActivitiesData,
    filteredCategories,
    filteredSubcategories,
    projects,
    updateActivities,
    search,
  ]);

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

  // Hotkey for opening command palette
  useHotkey("Mod+K", (event) => {
    event.preventDefault();
    setOpen(true);
    setStep("action");
    setSelectedAction(null);
    setSearch("");
    setInputValue("");
  });

  const handleBack = () => {
    if (step === "input") {
      setStep("action");
      setSelectedAction(null);
      setInputValue("");
    } else if (step === "value") {
      setStep("action");
      setSelectedAction(null);
      setSearch("");
    }
  };

  const handleActionSelect = (actionValue: string) => {
    const action = actionDefinitions.find((a) => a.value === actionValue);
    if (action) {
      if (action.type === "input") {
        setSelectedAction(actionValue);
        setStep("input");
        setInputValue(action.defaultValue || "");
      } else {
        setSelectedAction(actionValue);
        setStep("value");
        setSearch("");
      }
    }
  };

  const handleInputSubmit = () => {
    if (selectedAction && inputValue !== null) {
      const action = actionDefinitions.find((a) => a.value === selectedAction);
      if (action && action.type === "input") {
        action.action(inputValue);
        setOpen(false);
        setStep("action");
        setSelectedAction(null);
        setInputValue("");
        setSearch("");
      }
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <div className="p-2 text-xs text-muted-foreground">
          {selectedActivitiesData.length} activity
          {selectedActivitiesData.length > 1 ? "ies" : ""} selected
        </div>
        {step === "input" ? (
          <div className="flex items-center border-b px-3">
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
            <button
              className="ml-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={handleInputSubmit}
            >
              Submit
            </button>
          </div>
        ) : (
          <CommandInput
            placeholder={
              step === "action"
                ? `Search actions...`
                : `Search ${selectedAction}...`
            }
            value={search}
            onValueChange={setSearch}
          />
        )}
        <CommandList>
          {step === "action" ? (
            <>
              <CommandEmpty>No actions found.</CommandEmpty>
              {actionDefinitions.map((action) => (
                <CommandItem
                  key={action.value}
                  value={action.value}
                  onSelect={() => handleActionSelect(action.value)}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </CommandItem>
              ))}
            </>
          ) : step === "value" ? (
            <>
              <CommandItem
                key="back"
                value="back"
                onSelect={handleBack}
                className="text-muted-foreground"
              >
                ← Back to actions
              </CommandItem>
              <CommandSeparator />
              <CommandEmpty>No values found.</CommandEmpty>
              {filteredValues.map((value) => (
                <CommandItem
                  key={value.value}
                  value={value.value}
                  onSelect={() => {
                    value.action();
                    setOpen(false);
                    setStep("action");
                    setSelectedAction(null);
                    setSearch("");
                  }}
                >
                  {value.icon && <span className="mr-2">{value.icon}</span>}
                  {value.label}
                </CommandItem>
              ))}
            </>
          ) : (
            <>
              <CommandItem
                key="back"
                value="back"
                onSelect={handleBack}
                className="text-muted-foreground"
              >
                ← Back to actions
              </CommandItem>
              <CommandSeparator />
              <div className="p-2 text-sm">
                {
                  actionDefinitions.find((a) => a.value === selectedAction)
                    ?.placeholder
                }
              </div>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
