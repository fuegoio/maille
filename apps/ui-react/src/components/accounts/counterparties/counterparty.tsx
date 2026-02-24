import { useHotkey } from "@tanstack/react-hotkeys";
import { ChevronRight, Trash2 } from "lucide-react";
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
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { UserSelect } from "@/components/users/user-select";
import type { Counterparty } from "@/gql/graphql";
import { getCurrencyFormatter, cn } from "@/lib/utils";
import {
  deleteCounterpartyMutation,
  updateCounterpartyMutation,
} from "@/mutations/counterparties";
import { useActivities } from "@/stores/activities";
import { useCounterparties } from "@/stores/counterparties";
import { useSync } from "@/stores/sync";

export function Counterparty() {
  const counterpartyId = useCounterparties(
    (state) => state.focusedCounterparty,
  );
  const setFocusedCounterparty = useCounterparties(
    (state) => state.setFocusedCounterparty,
  );

  const onClose = () => {
    setFocusedCounterparty(null);
  };

  const mutate = useSync((state) => state.mutate);

  const counterparty = useCounterparties((state) =>
    counterpartyId ? state.getCounterpartyById(counterpartyId) : undefined,
  );
  const activities = useActivities((state) => state.activities);

  // Calculate the current liability of the counterparty based on transactions
  const getCounterpartyLiability = React.useCallback(() => {
    if (!counterparty) return 0;

    return activities
      .flatMap((activity) => activity.transactions)
      .filter(
        (transaction) =>
          transaction.fromCounterparty === counterparty.id ||
          transaction.toCounterparty === counterparty.id,
      )
      .reduce((total, transaction) => {
        // If money flows FROM counterparty TO me, they owe me less
        if (transaction.fromCounterparty === counterparty.id) {
          return total - transaction.amount;
        }
        // If money flows FROM me TO counterparty, they owe me more
        else if (transaction.toCounterparty === counterparty.id) {
          return total + transaction.amount;
        }
        return total;
      }, 0);
  }, [counterparty, activities]);

  // Get activities that involve this counterparty
  const counterpartyActivities = React.useMemo(() => {
    if (!counterparty) return [];

    return activities.filter((activity) =>
      activity.transactions.some(
        (transaction) =>
          transaction.fromCounterparty === counterparty.id ||
          transaction.toCounterparty === counterparty.id,
      ),
    );
  }, [counterparty, activities]);

  const deleteCounterparty = () => {
    if (!counterparty) return;
    const counterpartyData = { ...counterparty };
    mutate({
      name: "deleteCounterparty",
      mutation: deleteCounterpartyMutation,
      variables: {
        id: counterparty.id,
      },
      rollbackData: counterpartyData,
      events: [
        {
          type: "deleteCounterparty",
          payload: {
            id: counterparty.id,
          },
        },
      ],
    });
  };

  const handleUpdateCounterparty = (update: {
    name?: string;
    description?: string | null;
    contact?: string | null;
  }) => {
    if (!counterparty) return;
    const counterpartyData = { ...counterparty };
    mutate({
      name: "updateCounterparty",
      mutation: updateCounterpartyMutation,
      variables: {
        id: counterparty.id,
        ...update,
      },
      rollbackData: counterpartyData,
      events: [
        {
          type: "updateCounterparty",
          payload: {
            id: counterparty.id,
            ...update,
          },
        },
      ],
    });
  };

  // Hotkeys
  useHotkey("Escape", () => {
    onClose();
  });

  if (!counterparty) return null;

  const currencyFormatter = getCurrencyFormatter();

  return (
    <SidebarInset className="max-w-lg">
      <div className="flex h-full flex-col">
        <div className="flex h-12 w-full shrink-0 items-center border-b px-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-4 ml-8 h-8 w-6 lg:ml-0"
            onClick={onClose}
          >
            <ChevronRight className="h-6 w-6 transition hover:text-white" />
          </Button>
          <div className="text-sm font-medium text-white">Counterparty</div>

          <div className="flex-1" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete counterparty</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this counterparty? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteCounterparty}
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mb-4 px-4 pt-6 sm:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Current Liability
            </div>
            <div className="text-right font-mono text-xl font-semibold whitespace-nowrap">
              {currencyFormatter.format(getCounterpartyLiability())}
            </div>
          </div>

          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Counterparty name</FieldLabel>
                <Input
                  id="name"
                  value={counterparty.name}
                  onChange={(e) =>
                    handleUpdateCounterparty({ name: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  value={counterparty.description || ""}
                  onChange={(e) =>
                    handleUpdateCounterparty({
                      description: e.target.value || null,
                    })
                  }
                  className="resize-none"
                  placeholder="Add a description ..."
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="contact">Contact</FieldLabel>
                <UserSelect
                  id="contact"
                  value={counterparty.contact || ""}
                  onValueChange={(value) =>
                    handleUpdateCounterparty({ contact: value })
                  }
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>

        <div className="border-t px-4 py-6 sm:px-8">
          <div className="flex items-center">
            <div className="text-sm font-medium">
              Activities involving this counterparty
            </div>
            <div className="flex-1" />
          </div>

          <div className="mt-4 mb-2 rounded border bg-muted/50">
            {counterpartyActivities.length === 0 ? (
              <div className="text-primary-300 flex items-center justify-center py-4 text-xs">
                No activities involve this counterparty yet.
              </div>
            ) : (
              counterpartyActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center px-4 text-sm hover:bg-muted",
                    index !== counterpartyActivities.length - 1 && "border-b",
                  )}
                >
                  <div className="hidden w-8 shrink-0 text-muted-foreground sm:block">
                    #{activity.number}
                  </div>
                  <div className="ml-2 hidden w-20 shrink-0 text-muted-foreground sm:block">
                    {activity.date.toLocaleDateString("fr-FR")}
                  </div>
                  <div className="w-10 shrink-0 text-muted-foreground sm:hidden">
                    {activity.date.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>

                  <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {activity.name}
                  </div>
                  <div className="flex-1" />
                  <div className="w-20 text-right font-mono whitespace-nowrap">
                    {currencyFormatter.format(activity.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
