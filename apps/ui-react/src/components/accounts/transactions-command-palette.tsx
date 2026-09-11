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
  /** The account whose transactions view opened the palette. */
  accountId: string;
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
      /** Retargets the counterpart account: the side that is not this view's. */
      account?: string;
      /** Sets this view's account-side fund; null means Untracked. */
      fund?: string | null;
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
        if (update.account !== undefined) {
          if (transaction.fromAccount === accountId) {
            updateFields.toAccount = update.account;
          } else {
            updateFields.fromAccount = update.account;
          }
        }

        // Fund legs follow the transaction.tsx canonical shape: one leg
        // holding the from and to funds, Untracked sides as null. A fund
        // change keeps the other side's fund; an amount change carries
        // over to the existing legs.
        const existingFundMoves = transaction.fundMoves ?? [];
        let effectiveFundMoves: FundMove[] | undefined;
        if (update.fund !== undefined) {
          const trackedFromFund =
            existingFundMoves.find((m) => m.fromFund)?.fromFund ?? null;
          const trackedToFund =
            existingFundMoves.find((m) => m.toFund)?.toFund ?? null;
          const fromFund =
            transaction.fromAccount === accountId
              ? update.fund
              : trackedFromFund;
          const toFund =
            transaction.fromAccount === accountId ? trackedToFund : update.fund;
          effectiveFundMoves =
            fromFund !== null || toFund !== null
              ? [
                  {
                    id: crypto.randomUUID(),
                    fromFund,
                    toFund,
                    amount: update.amount ?? transaction.amount,
                    note: null,
                    date: new Date(),
                    transaction: null,
                  },
                ]
              : [];
        } else if (
          update.amount !== undefined &&
          existingFundMoves.length > 0
        ) {
          effectiveFundMoves = existingFundMoves.map(
            (move): FundMove => ({
              ...move,
              amount: update.amount as number,
            }),
          );
        }

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
    [selectedTransactionsData, activities, mutate, accountId],
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
        value: "account",
        label: "Change account",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "C",
        getValues: () => {
          return accounts
            .filter((account) => account.id !== accountId)
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
                updateTransactions({ account: account.id });
              },
            }));
        },
      },
      {
        value: "fund",
        label: "Change fund",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "F",
        getValues: () => {
          const fundOptions: {
            value: string;
            label: string;
            icon: React.ReactNode;
            action: () => void;
          }[] = funds.map((fund: Fund) => ({
            value: `fund-${fund.id}`,
            label: fund.name,
            icon: (
              <div
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: fund.color }}
              />
            ),
            action: () => {
              updateTransactions({ fund: fund.id });
            },
          }));
          fundOptions.push({
            value: "fund-null",
            label: "Untracked",
            icon: (
              <div className="size-3 shrink-0 rounded-sm bg-muted-foreground/40" />
            ),
            action: () => {
              updateTransactions({ fund: null });
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
    accountId,
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
            <div className="min-w-0 flex-1">
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
