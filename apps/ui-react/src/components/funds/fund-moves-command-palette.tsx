import type { FundMove } from "@maille/core/funds";

import { DollarSign, Tag, Trash2 } from "lucide-react";
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
import { updateTransactionMutation } from "@/mutations/activities";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useSync } from "@/stores/sync";

interface FundMovesCommandPaletteProps {
  selectedFundMoves: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearSelection?: () => void;
}

type SelectedFundMove = {
  fundMove: FundMove;
  activityId: string;
  transactionId: string;
};

export function FundMovesCommandPalette({
  selectedFundMoves,
  open,
  onOpenChange,
  onClearSelection,
}: FundMovesCommandPaletteProps) {
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
  const funds = useFunds((state) => state.funds);

  const selectedFundMovesData = React.useMemo(() => {
    const result: SelectedFundMove[] = [];
    for (const activity of activities) {
      for (const transaction of activity.transactions) {
        for (const fundMove of transaction.fundMoves ?? []) {
          if (selectedFundMoves.includes(fundMove.id)) {
            result.push({
              fundMove,
              activityId: activity.id,
              transactionId: transaction.id,
            });
          }
        }
      }
    }
    return result;
  }, [selectedFundMoves, activities]);

  const updateFundMoves = React.useCallback(
    (update: {
      amount?: number;
      fromFund?: string | null;
      toFund?: string | null;
    }) => {
      selectedFundMovesData.forEach(
        ({ fundMove, activityId, transactionId }) => {
          const activity = activities.find((a) => a.id === activityId);
          if (!activity) return;
          const transaction = activity.transactions.find(
            (t) => t.id === transactionId,
          );
          if (!transaction) return;

          const oldTransaction = { ...transaction };

          const updatedFundMoves = (transaction.fundMoves ?? []).map((move) => {
            if (move.id !== fundMove.id) return move;
            return {
              ...move,
              ...(update.amount !== undefined ? { amount: update.amount } : {}),
              ...(update.fromFund !== undefined
                ? { fromFund: update.fromFund }
                : {}),
              ...(update.toFund !== undefined ? { toFund: update.toFund } : {}),
            };
          });

          const updateFields: { amount?: number } = {};
          if (update.amount !== undefined) {
            updateFields.amount = update.amount;
          }

          mutate({
            name: "updateTransaction",
            mutation: updateTransactionMutation,
            variables: {
              activityId,
              id: transactionId,
              ...updateFields,
              fundMoves: updatedFundMoves.map((move) => ({
                id: move.id,
                fromFund: move.fromFund,
                toFund: move.toFund,
                amount: move.amount,
                note: move.note,
              })),
            },
            rollbackData: oldTransaction,
            events: [
              {
                type: "updateTransaction",
                payload: {
                  activityId,
                  id: transactionId,
                  ...updateFields,
                  fundMoves: updatedFundMoves.map((move) => ({
                    id: move.id,
                    fromFund: move.fromFund,
                    toFund: move.toFund,
                    amount: move.amount,
                    note: move.note,
                    transaction: transactionId,
                    date: move.date.toISOString(),
                  })),
                },
              },
            ],
          });
        },
      );
    },
    [selectedFundMovesData, activities, mutate],
  );

  const deleteFundMoves = React.useCallback(() => {
    selectedFundMovesData.forEach(({ fundMove, activityId, transactionId }) => {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;
      const transaction = activity.transactions.find(
        (t) => t.id === transactionId,
      );
      if (!transaction) return;

      const oldTransaction = { ...transaction };

      const remainingFundMoves = (transaction.fundMoves ?? []).filter(
        (move) => move.id !== fundMove.id,
      );

      mutate({
        name: "updateTransaction",
        mutation: updateTransactionMutation,
        variables: {
          activityId,
          id: transactionId,
          fundMoves: remainingFundMoves.map((move) => ({
            id: move.id,
            fromFund: move.fromFund,
            toFund: move.toFund,
            amount: move.amount,
            note: move.note,
          })),
        },
        rollbackData: oldTransaction,
        events: [
          {
            type: "updateTransaction",
            payload: {
              activityId,
              id: transactionId,
              fundMoves: remainingFundMoves.map((move) => ({
                id: move.id,
                fromFund: move.fromFund,
                toFund: move.toFund,
                amount: move.amount,
                note: move.note,
                transaction: transactionId,
                date: move.date.toISOString(),
              })),
            },
          },
        ],
      });
    });
  }, [selectedFundMovesData, activities, mutate]);

  const actionDefinitions = React.useMemo(() => {
    const actions = [
      {
        value: "amount",
        label: "Change amount",
        icon: <DollarSign />,
        type: "input" as const,
        placeholder: "Enter new amount...",
        defaultValue:
          selectedFundMovesData[0]?.fundMove.amount?.toString() || "",
        shortcut: "A",
        action: (value: string) => {
          const amount = parseFloat(value);
          if (!isNaN(amount)) {
            updateFundMoves({ amount });
          }
        },
      },
      {
        value: "fromFund",
        label: "Change from fund",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "F",
        getValues: () => {
          const fundOptions = funds.map((fund) => ({
            value: `fromFund-${fund.id}`,
            label: fund.name,
            icon: (
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
            ),
            action: () => {
              updateFundMoves({ fromFund: fund.id });
            },
          }));
          fundOptions.push({
            value: "fromFund-null",
            label: "Untracked",
            icon: (
              <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            ),
            action: () => {
              updateFundMoves({ fromFund: null });
            },
          });
          return fundOptions;
        },
      },
      {
        value: "toFund",
        label: "Change to fund",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "T",
        getValues: () => {
          const fundOptions = funds.map((fund) => ({
            value: `toFund-${fund.id}`,
            label: fund.name,
            icon: (
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
            ),
            action: () => {
              updateFundMoves({ toFund: fund.id });
            },
          }));
          fundOptions.push({
            value: "toFund-null",
            label: "Untracked",
            icon: (
              <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            ),
            action: () => {
              updateFundMoves({ toFund: null });
            },
          });
          return fundOptions;
        },
      },
      {
        value: "delete",
        label: "Delete",
        icon: <Trash2 />,
        type: null,
        shortcut: "Del",
        action: () => {
          deleteFundMoves();
        },
      },
    ];
    return actions;
  }, [selectedFundMovesData, funds, updateFundMoves, deleteFundMoves]);

  const filteredActions = React.useMemo(() => {
    if (!search) return actionDefinitions;
    return actionDefinitions.filter((action) =>
      action.label.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, actionDefinitions]);

  const actionValues = React.useMemo(() => {
    if (!selectedAction) return [];
    const action = actionDefinitions.find((a) => a.value === selectedAction);
    return action && action.type === "select" ? action.getValues() : [];
  }, [selectedAction, actionDefinitions]);

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
                heading={`${selectedFundMovesData.length} fund move${selectedFundMovesData.length > 1 ? "s" : ""} selected`}
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
