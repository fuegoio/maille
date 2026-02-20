import { Users, Plus } from "lucide-react";
import { useMemo } from "react";

import { getCurrencyFormatter } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
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

import { AddCounterpartyModal } from "./add-counterparty-modal";

interface CounterpartiesTableProps {
  accountId: string;
}

export function CounterpartiesTable({ accountId }: CounterpartiesTableProps) {
  const counterparties = useCounterparties((state) => state.counterparties);
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = getCurrencyFormatter();

  const accountCounterparties = useMemo(() => {
    return counterparties.filter(
      (counterparty) => counterparty.account === accountId,
    );
  }, [counterparties, accountId]);

  const getCounterpartyLiability = (counterpartyId: string) => {
    return activities
      .flatMap((activity) => activity.transactions)
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
                className="group flex h-10 w-full items-center border-b pr-6 pl-14 hover:bg-muted/50"
              >
                <div className="text-sm font-medium">{counterparty.name}</div>
                {counterparty.description && (
                  <div className="mx-2 text-sm text-muted-foreground">
                    {counterparty.description}
                  </div>
                )}
                {counterparty.user && (
                  <Badge className="ml-4" variant="outline">
                    {counterparty.user}
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
