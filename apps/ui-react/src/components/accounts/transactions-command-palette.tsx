import type { Transaction } from "@maille/core/activities";
import type { Fund, FundMove } from "@maille/core/funds";

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
import {
  removeTransactionHistoryEvent,
  updateTransactionHistoryEvent,
} from "@/lib/history-events";
import { cn } from "@/lib/utils";
import {
  deleteTransactionMutation,
  updateTransactionMutation,
} from "@/mutations/activities";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useSync } from "@/stores/sync";

interface TransactionsCommandPaletteProps {
  selectedTransactions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearSelection?: () => void;
}

type SelectedTransaction = {
  transaction: Transaction;
  activityId: string;
};

export function TransactionsCommandPalette({
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

  const mutate = useSync((state) => state.mutate);
  const accounts = useAccounts((state) => state.accounts);
  const activities = useActivities((state) => state.activities);
  const funds = useFunds((state) => state.funds);

  const selectedTransactionsData = React.useMemo(() => {
    const result: SelectedTransaction[] = [];
    for (const activity of activities) {
      for (const transaction of activity.transactions) {
        if (selectedTransactions.includes(transaction.id)) {
          result.push({ transaction, activityId: activity.id });
        }
      }
    }
    return result;
  }, [selectedTransactions, activities]);

  const updateTransactions = React.useCallback(
    (update: {
      amount?: number;
      fromAccount?: string;
      toAccount?: string;
      fromFund?: string | null;
      toFund?: string | null;
    }) => {
      selectedTransactionsData.forEach(({ transaction, activityId }) => {
        const activity = activities.find((a) => a.id === activityId);
        if (!activity) return;

        const oldTransaction = { ...transaction };

        const updateFields: Pick<
          Partial<Transaction>,
          "amount" | "fromAccount" | "toAccount"
        > = {};
        if (update.amount !== undefined) updateFields.amount = update.amount;
        if (update.fromAccount !== undefined)
          updateFields.fromAccount = update.fromAccount;
        if (update.toAccount !== undefined)
          updateFields.toAccount = update.toAccount;

        const hasAmountChange = update.amount !== undefined;
        const hasFundChange =
          update.fromFund !== undefined || update.toFund !== undefined;
        const existingFundMoves = transaction.fundMoves ?? [];

        const effectiveFundMoves: FundMove[] | undefined =
          hasAmountChange && existingFundMoves.length > 0
            ? existingFundMoves.map(
                (move): FundMove => ({
                  ...move,
                  amount: update.amount as number,
                  ...(update.fromFund !== undefined
                    ? { fromFund: update.fromFund }
                    : {}),
                  ...(update.toFund !== undefined
                    ? { toFund: update.toFund }
                    : {}),
                }),
              )
            : hasFundChange
              ? existingFundMoves.map(
                  (move): FundMove => ({
                    ...move,
                    ...(update.fromFund !== undefined
                      ? { fromFund: update.fromFund }
                      : {}),
                    ...(update.toFund !== undefined
                      ? { toFund: update.toFund }
                      : {}),
                  }),
                )
              : undefined;

        const historyEvent = updateTransactionHistoryEvent(
          activity,
          transaction,
          {
            ...transaction,
            ...updateFields,
          },
        );

        const serializedFundMoves =
          effectiveFundMoves !== undefined
            ? effectiveFundMoves.map((move) => ({
                id: move.id,
                fromFund: move.fromFund,
                toFund: move.toFund,
                amount: move.amount,
                note: move.note,
                transaction: transaction.id,
                date: move.date.toISOString(),
              }))
            : undefined;

        mutate({
          name: "updateTransaction",
          mutation: updateTransactionMutation,
          variables: {
            activityId,
            id: transaction.id,
            ...updateFields,
            ...(effectiveFundMoves !== undefined
              ? {
                  fundMoves: effectiveFundMoves.map((move) => ({
                    id: move.id,
                    fromFund: move.fromFund,
                    toFund: move.toFund,
                    amount: move.amount,
                    note: move.note,
                  })),
                }
              : {}),
          },
          rollbackData: oldTransaction,
          events: [
            {
              type: "updateTransaction",
              payload: {
                activityId,
                id: transaction.id,
                ...updateFields,
                ...(serializedFundMoves !== undefined
                  ? { fundMoves: serializedFundMoves }
                  : {}),
              },
            },
            ...(historyEvent ? [historyEvent] : []),
          ],
        });
      });
    },
    [selectedTransactionsData, activities, mutate],
  );

  const deleteTransactions = React.useCallback(() => {
    selectedTransactionsData.forEach(({ transaction, activityId }) => {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      mutate({
        name: "deleteTransaction",
        mutation: deleteTransactionMutation,
        variables: {
          activityId,
          id: transaction.id,
        },
        rollbackData: transaction,
        events: [
          {
            type: "deleteTransaction",
            payload: {
              activityId,
              id: transaction.id,
            },
          },
          removeTransactionHistoryEvent(activity, transaction),
        ],
      });
    });
  }, [selectedTransactionsData, activities, mutate]);

  const actionDefinitions = React.useMemo(() => {
    const actions = [
      {
        value: "amount",
        label: "Change amount",
        icon: <DollarSign />,
        type: "input" as const,
        placeholder: "Enter new amount...",
        defaultValue:
          selectedTransactionsData[0]?.transaction.amount?.toString() || "",
        shortcut: "A",
        action: (value: string) => {
          const amount = parseFloat(value);
          if (!isNaN(amount)) {
            updateTransactions({ amount });
          }
        },
      },
      {
        value: "fromAccount",
        label: "Change from account",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "F",
        getValues: () => {
          return accounts.map((account) => ({
            value: `fromAccount-${account.id}`,
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
              updateTransactions({ fromAccount: account.id });
            },
          }));
        },
      },
      {
        value: "toAccount",
        label: "Change to account",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "T",
        getValues: () => {
          return accounts.map((account) => ({
            value: `toAccount-${account.id}`,
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
              updateTransactions({ toAccount: account.id });
            },
          }));
        },
      },
      {
        value: "fromFund",
        label: "Change from fund",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "G",
        getValues: () => {
          const fundOptions: {
            value: string;
            label: string;
            icon: React.ReactNode;
            action: () => void;
          }[] = funds.map((fund: Fund) => ({
            value: `fromFund-${fund.id}`,
            label: fund.name,
            icon: (
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
            ),
            action: () => {
              updateTransactions({ fromFund: fund.id });
            },
          }));
          fundOptions.push({
            value: "fromFund-null",
            label: "Untracked",
            icon: (
              <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            ),
            action: () => {
              updateTransactions({ fromFund: null });
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
        shortcut: "H",
        getValues: () => {
          const fundOptions: {
            value: string;
            label: string;
            icon: React.ReactNode;
            action: () => void;
          }[] = funds.map((fund: Fund) => ({
            value: `toFund-${fund.id}`,
            label: fund.name,
            icon: (
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
            ),
            action: () => {
              updateTransactions({ toFund: fund.id });
            },
          }));
          fundOptions.push({
            value: "toFund-null",
            label: "Untracked",
            icon: (
              <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            ),
            action: () => {
              updateTransactions({ toFund: null });
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
          deleteTransactions();
        },
      },
    ];
    return actions;
  }, [
    selectedTransactionsData,
    accounts,
    funds,
    updateTransactions,
    deleteTransactions,
  ]);

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
                heading={`${selectedTransactionsData.length} transaction${selectedTransactionsData.length > 1 ? "s" : ""} selected`}
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
