import type { Movement } from "@maille/core/movements";

import {
  Calendar,
  DollarSign,
  Sparkles,
  Tag,
  TextCursor,
  Trash2,
} from "lucide-react";
import * as React from "react";

import type { BulkAction } from "@/components/shared/bulk-actions";

import { useTriggerWorkflow } from "@/hooks/use-trigger-workflow";
import { getGraphQLDate } from "@/lib/date";
import {
  movementUpdateHistoryEvent,
  unlinkActivityHistoryEvent,
} from "@/lib/history-events";
import { cn } from "@/lib/utils";
import {
  deleteMovementMutation,
  updateMovementMutation,
} from "@/mutations/movements";
import { ACCOUNT_TYPES_COLOR, useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";
import { useWorkflows } from "@/stores/workflows";

export function useMovementsBulkActions(
  selectedMovementIds: string[],
  onClearSelection?: () => void,
): BulkAction[] {
  const mutate = useSync((state) => state.mutate);
  const movements = useMovements((state) => state.movements);
  const accounts = useAccounts((state) => state.accounts);
  const triggerWorkflow = useTriggerWorkflow();
  const triggeringMovementIds = useWorkflows(
    (state) => state.triggeringMovementIds,
  );

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
      account?: string;
    }) => {
      selectedMovementIds.forEach((movementId) => {
        const movement = movements.find((m) => m.id === movementId);
        if (!movement) return;

        const oldMovement = { ...movement };
        const historyEvent = movementUpdateHistoryEvent(movement, update);

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
            ...(historyEvent ? [historyEvent] : []),
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
      const movementToDelete = { ...movement };

      const unlinkEvents = movement.activities
        .map((ma) => {
          const linkedActivity = useActivities
            .getState()
            .getActivityById(ma.activity);
          return linkedActivity
            ? unlinkActivityHistoryEvent(
                linkedActivity,
                { id: movement.id, name: movement.name },
                ma.amount,
              )
            : null;
        })
        .filter((event) => event !== null);

      mutate({
        name: "deleteMovement",
        mutation: deleteMovementMutation,
        variables: { id: movement.id },
        rollbackData: movementToDelete,
        events: [
          { type: "deleteMovement", payload: { id: movement.id } },
          ...unlinkEvents,
        ],
      });
    });
  }, [selectedMovementIds, movements, mutate]);

  const isTriggering = selectedMovementsData.some((m) =>
    triggeringMovementIds.includes(m.id),
  );
  const isReconciled = selectedMovementsData.every(
    (m) => m.status === "completed",
  );

  return React.useMemo(() => {
    const clearAndComplete = () => {
      onClearSelection?.();
    };

    return [
      {
        value: "create-activity",
        label: isReconciled
          ? "Already reconciled"
          : isTriggering
            ? "Starting..."
            : "Create activity (workflow)",
        icon: <Sparkles />,
        type: null,
        shortcut: "W",
        disabled: isTriggering || isReconciled,
        action: () => {
          selectedMovementIds.forEach((movementId) => {
            triggerWorkflow(movementId);
          });
          clearAndComplete();
        },
      },
      {
        value: "name",
        label: "Set new name",
        icon: <TextCursor />,
        type: "input" as const,
        placeholder: "Enter new name...",
        defaultValue: selectedMovementsData[0]?.name || "",
        shortcut: "N",
        action: (value?: string) => {
          if (value && value.trim()) {
            updateMovements({ name: value });
          }
          clearAndComplete();
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
        action: (value?: string) => {
          if (!value) return;
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              updateMovements({ date });
            }
          } catch {
            // Invalid date format
          }
          clearAndComplete();
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
        action: (value?: string) => {
          if (!value) return;
          const amount = parseFloat(value);
          if (!isNaN(amount)) {
            updateMovements({ amount });
          }
          clearAndComplete();
        },
      },
      {
        value: "account",
        label: "Change account",
        icon: <Tag />,
        type: "select" as const,
        shortcut: "C",
        getValues: () =>
          accounts
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
                clearAndComplete();
              },
            })),
      },
      {
        value: "delete",
        label: "Delete",
        icon: <Trash2 />,
        type: null,
        shortcut: "Del",
        variant: "destructive" as const,
        action: () => {
          deleteMovements();
          clearAndComplete();
        },
      },
    ];
  }, [
    selectedMovementsData,
    accounts,
    updateMovements,
    deleteMovements,
    triggerWorkflow,
    isTriggering,
    isReconciled,
    selectedMovementIds,
    onClearSelection,
  ]);
}
