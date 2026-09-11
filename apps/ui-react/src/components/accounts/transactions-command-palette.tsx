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

import { useTransactionsEntityActions } from "./transactions-actions";

interface TransactionsCommandPaletteProps {
  /** The account whose transactions view opened the palette. */
  accountId: string;
  selectedTransactions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearSelection?: () => void;
}

export function TransactionsCommandPalette({
  accountId,
  selectedTransactions,
  open,
  onOpenChange,
  onClearSelection,
}: TransactionsCommandPaletteProps) {
  const [search, setSearch] = React.useState("");
  const [step, setStep] = React.useState<"action" | "value" | "input">(
    "action",
  );
  const [selectedAction, setSelectedAction] = React.useState<string | null>(
    null,
  );
  const [inputValue, setInputValue] = React.useState("");

  const actions = useTransactionsEntityActions(
    accountId,
    selectedTransactions,
    onClearSelection,
  );

  const filteredActions = React.useMemo(() => {
    if (!search) return actions;
    return actions.filter((action) =>
      action.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, actions]);

  const actionValues = React.useMemo(() => {
    if (!selectedAction) return [];
    const action = actions.find((a) => a.value === selectedAction);
    return action && action.type === "select" ? action.getValues!() : [];
  }, [selectedAction, actions]);

  const filteredValues = React.useMemo(() => {
    if (!search) return actionValues;
    return actionValues.filter((value) =>
      value.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, actionValues]);

  const handleActionSelect = (actionValue: string) => {
    const action = actions.find((a) => a.value === actionValue);
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
        action.action?.();
        onClearSelection?.();
        onOpenChange(false);
        setStep("action");
        setSelectedAction(null);
        setSearch("");
      }
    }
  };

  const handleInputSubmit = () => {
    if (selectedAction && inputValue !== null) {
      const action = actions.find((a) => a.value === selectedAction);
      if (action && action.type === "input") {
        action.action?.(inputValue);
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
            <div className="min-w-0 flex-1">
              <CommandInput
                placeholder={
                  actions.find((a) => a.value === selectedAction)
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
            </div>
            <CommandShortcut className="mr-2 text-sm">Enter</CommandShortcut>
          </div>
        ) : (
          <>
            <CommandInput
              placeholder={
                step === "action"
                  ? "Type a command or search..."
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
                heading={`${selectedTransactions.length} transaction${selectedTransactions.length > 1 ? "s" : ""} selected`}
              >
                {filteredActions.map((action) => (
                  <CommandItem
                    key={action.value}
                    value={action.value}
                    onSelect={() => handleActionSelect(action.value)}
                  >
                    {action.icon}
                    {action.label}
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {step === "value" && (
            <>
              <CommandEmpty>No values found.</CommandEmpty>
              <CommandGroup
                heading={actions.find((a) => a.value === selectedAction)?.label}
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
