import { useHotkey } from "@tanstack/react-hotkeys";
import { Users, Plus } from "lucide-react";
import { useMemo } from "react";

import { AddCounterpartyModal } from "@/components/counterparties/add-counterparty-modal";
import {
  computeRowOutlines,
  rowOutlineClasses,
} from "@/components/shared/row-outline";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useListFocus } from "@/hooks/use-list-focus";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useContacts } from "@/stores/contacts";
import { useCounterparties } from "@/stores/counterparties";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../ui/empty";

interface CounterpartiesTableProps {
  accountId: string;
}

export function CounterpartiesTable({ accountId }: CounterpartiesTableProps) {
  const counterparties = useCounterparties((state) => state.counterparties);
  const focusedCounterparty = useCounterparties(
    (state) => state.focusedCounterparty,
  );
  const setFocusedCounterparty = useCounterparties(
    (state) => state.setFocusedCounterparty,
  );
  const activities = useActivities((state) => state.activities);
  const contacts = useContacts((state) => state.contacts);
  const user = useAuth((state) => state.user!);

  const currencyFormatter = useCurrencyFormatter();

  const accountCounterparties = useMemo(() => {
    return counterparties.filter(
      (counterparty) => counterparty.account === accountId,
    );
  }, [counterparties, accountId]);

  const accountCounterpartyIds = useMemo(
    () => accountCounterparties.map((counterparty) => counterparty.id),
    [accountCounterparties],
  );

  const { focusedId, registerRow, moveFocus, clearFocus } = useListFocus(
    accountCounterpartyIds,
  );

  // Hotkeys: J/K move a focused row through the list (K up, J down, first
  // row when nothing is focused), Enter opens the focused counterparty's
  // panel
  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    moveFocus(-1);
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    moveFocus(1);
  });

  useHotkey(
    "Enter",
    () => {
      if (focusedId !== null) {
        setFocusedCounterparty(focusedId);
      }
    },
    {
      ignoreInputs: true,
    },
  );

  useHotkey(
    "Escape",
    () => {
      clearFocus();
    },
    {
      conflictBehavior: "allow",
    },
  );

  // Outline sides for selected rows: keyboard-focused or panel-open
  const rowOutlines = useMemo(
    () =>
      computeRowOutlines(
        accountCounterparties.map((counterparty) => ({
          id: counterparty.id,
          selected:
            counterparty.id === focusedId ||
            counterparty.id === focusedCounterparty,
        })),
      ),
    [accountCounterparties, focusedId, focusedCounterparty],
  );

  const getCounterpartyLiability = (counterpartyId: string) => {
    const counterparty = accountCounterparties.find(
      (c) => c.id === counterpartyId,
    );

    const transactionsTotal = activities
      .filter((a) => a.date >= user.startingDate)
      .flatMap((a) => a.transactions)
      .filter(
        (transaction) =>
          transaction.fromCounterparty === counterpartyId ||
          transaction.toCounterparty === counterpartyId,
      )
      .reduce((total, transaction) => {
        // If money flows FROM counterparty TO me, they owe me less
        if (transaction.fromCounterparty === counterpartyId) {
          return total - transaction.amount;
        }
        // If money flows FROM me TO counterparty, they owe me more
        else if (transaction.toCounterparty === counterpartyId) {
          return total + transaction.amount;
        }
        return total;
      }, 0);

    return (counterparty?.initialBalance ?? 0) + transactionsTotal;
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        {accountCounterparties.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Users className="size-6 text-muted-foreground" />
                </div>
              </EmptyMedia>
              <EmptyTitle>No counterparties yet</EmptyTitle>
              <EmptyDescription>
                This account doesn't have any counterparties. Add your first
                counterparty to get started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <AddCounterpartyModal accountId={accountId}>
                <Button>
                  <Plus />
                  Add counterparty
                </Button>
              </AddCounterpartyModal>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-1 flex-col overflow-x-hidden">
            <header className="flex h-8 items-center border-b bg-muted/50 pr-6 pl-14 text-xs font-medium text-muted-foreground">
              <div className="flex-1">Counterparty name</div>
              <div className="text-right">Liability</div>
            </header>

            {accountCounterparties.map((counterparty) => (
              <div
                key={counterparty.id}
                ref={registerRow(counterparty.id)}
                className={cn(
                  "group flex h-10 w-full cursor-pointer items-center border-b pr-6 pl-14 hover:bg-muted/50",
                  rowOutlines.has(counterparty.id) &&
                    rowOutlineClasses(rowOutlines.get(counterparty.id)!),
                )}
                onClick={() => setFocusedCounterparty(counterparty.id)}
              >
                <div className="text-sm font-semibold">{counterparty.name}</div>
                {counterparty.description && (
                  <div className="mx-2 text-sm text-muted-foreground">
                    {counterparty.description}
                  </div>
                )}

                {counterparty.contact && (
                  <Badge className="ml-4" variant="outline">
                    {
                      contacts.find(
                        (c) => c.contact.id === counterparty.contact,
                      )?.contact.name
                    }
                  </Badge>
                )}

                <div className="flex-1" />

                <div className="text-right font-mono text-sm">
                  {currencyFormatter.format(
                    getCounterpartyLiability(counterparty.id),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
