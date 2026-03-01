import type { Movement } from "@maille/core/movements";
import { Calendar, DollarSign, Tag, TextCursor, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  deleteMovementMutation,
  updateMovementMutation,
} from "@/mutations/movements";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

interface MovementsCommandPaletteProps {
  selectedMovements: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearSelection?: () => void;
}

export function MovementsCommandPalette({
  selectedMovements,
  open,
  onOpenChange,
  onClearSelection,
}: MovementsCommandPaletteProps) {
  const [search, setSearch] = React.useState("");
  const [step, setStep] = React.useState<"action" | "value" | "input">(
    "action",
  );
  const [selectedAction, setSelectedAction] = React.useState<string | null>(
    null,
  );
  const [inputValue, setInputValue] = React.useState("");

  const mutate = useSync((state) => state.mutate);
  const movements = useMovements((state) => state.movements);
  const accounts = useAccounts((state) => state.accounts);

  const selectedMovementIds = React.useMemo(() => {
    return selectedMovements.length > 0
      ? selectedMovements
      : useMovements.getState().focusedMovement
        ? [useMovements.getState().focusedMovement]
        : [];
  }, [selectedMovements]);

  const selectedMovementsData = React.useMemo(() => {
    return selectedMovementIds
      .map((id) => movements.find((m) => m.id === id))
      .filter(Boolean) as Movement[];
  }, [selectedMovementIds, movements]);

  const updateMovements = React.useCallback(
    (update: {
      name?: string;
      date?: Date;
      amount?: number;
      account?: string | null;
    }) => {
      selectedMovementIds.forEach((movementId) => {
        const movement = movements.find((m) => m.id === movementId);
        if (!movement) return;

        // Create a copy of the current movement for rollback
        const oldMovement = { ...movement };

        mutate({
          name: "updateMovement",
          mutation: updateMovementMutation,
          variables: {
            id: movement.id,
            ...update,
            date: update.date ? getGraphQLDate(update.date) : undefined,
          },
          rollbackData: {
            ...oldMovement,
            date: getGraphQLDate(oldMovement.date),
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
          ],
        });
      });
    },
    [selectedMovementIds, movements, mutate],
  );

  const deleteMovements = React.useCallback(() => {
    selectedMovementIds.forEach((movementId) => {
      const movement = movements.find((m) => m.id === movementId);
      if (!movement) return;
      // Create a copy of the movement for rollback
      const movementToDelete = { ...movement };

      mutate({
        name: "deleteMovement",
        mutation: deleteMovementMutation,
        variables: {
          id: movement.id,
        },
        rollbackData: movementToDelete,
        events: [
          {
            type: "deleteMovement",
            payload: {
              id: movement.id,
            },
          },
        ],
      });
    });
  }, [selectedMovementIds, movements, mutate]);

  // Action definitions
  const actionDefinitions = React.useMemo(() => {
    const actions = [
      {
        value: "name",
        label: "Set new name",
        icon: <TextCursor />,
        type: "input" as const,
        placeholder: "Enter new name...",
        defaultValue: selectedMovementsData[0]?.name || "",
        shortcut: "N",
        action: (value: string) => {
          if (value.trim()) {
            updateMovements({ name: value });
          }
        },
      },
      {
        value: "date",
        label: "Change date",
        icon: <Calendar />,
        type: "input" as const,
        placeholder: "Enter new date (YYYY-MM-DD)...",
        defaultValue: selectedMovementsData[0]?.date
          ? getGraphQLDate(selectedMovementsData[0].date)
          : "",
        shortcut: "D",
        action: (value: string) => {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              updateMovements({ date: date });
            }
          } catch {
            // Invalid date format, do nothing
          }
        },
      },
      {
        value: "amount",
        label: "Change amount",
        icon: <DollarSign />,
        type: "input" as const,
        placeholder: "Enter new amount...",
        defaultValue: selectedMovementsData[0]?.amount?.toString() || "",
        shortcut: "A",
        action: (value: string) => {
          const amount = parseFloat(value);
          if (!isNaN(amount)) {
            updateMovements({ amount: amount });
          }
        },
      },
      {
        value: "account",
        label: "Change account",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "C",
        getValues: () => {
          return [
            ...accounts
              .filter((a) => a.movements)
              .map((account) => ({
                value: `account-${account.id}`,
                label: account.name,
                icon: (
                  <div
                    className={cn(
                      "size-3 shrink-0 rounded-xl",
                      ACCOUNT_TYPES_COLOR[account.type],
                    )}
                  />
                ),
                action: () => {
                  updateMovements({ account: account.id });
                },
              })),
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
          deleteMovements();
          onClearSelection?.();
        },
      },
    ];
    return actions;
  }, [
    selectedMovementsData,
    accounts,
    updateMovements,
    deleteMovements,
    onClearSelection,
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
                heading={`${selectedMovementsData.length} movement${selectedMovementsData.length > 1 ? "s" : ""} selected`}
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
