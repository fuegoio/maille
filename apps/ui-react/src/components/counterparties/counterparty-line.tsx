import { Link } from "@tanstack/react-router";

import type { Counterparty } from "@/gql/graphql";

import { AccountLabel } from "@/components/accounts/account-label";
import { Badge } from "@/components/ui/badge";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useActivities } from "@/stores/activities";
import { useAuth } from "@/stores/auth";
import { useContacts } from "@/stores/contacts";

interface CounterpartyLineProps {
  counterparty: Counterparty;
}

export function CounterpartyLine({ counterparty }: CounterpartyLineProps) {
  const currencyFormatter = useCurrencyFormatter();
  const activities = useActivities((state) => state.activities);
  const contacts = useContacts((state) => state.contacts);
  const user = useAuth((state) => state.user!);

  const getCounterpartyLiability = () => {
    const transactionsTotal = activities
      .filter((a) => a.date >= user.startingDate)
      .flatMap((a) => a.transactions)
      .filter(
        (transaction) =>
          transaction.fromCounterparty === counterparty.id ||
          transaction.toCounterparty === counterparty.id,
      )
      .reduce((total, transaction) => {
        if (transaction.fromCounterparty === counterparty.id) {
          return total - transaction.amount;
        } else if (transaction.toCounterparty === counterparty.id) {
          return total + transaction.amount;
        }
        return total;
      }, 0);

    return (counterparty.initialBalance ?? 0) + transactionsTotal;
  };

  const contactName = counterparty.contact
    ? contacts.find((c) => c.contact.id === counterparty.contact)?.contact.name
    : null;

  return (
    <Link
      to="/counterparties/$id"
      params={{ id: counterparty.id }}
      className="group flex h-10 shrink-0 items-center gap-2 overflow-hidden border-b pr-2 pl-5.5 text-sm transition-colors hover:bg-accent lg:pr-6"
    >
      <div className="min-w-0 overflow-hidden font-medium text-ellipsis whitespace-nowrap">
        {counterparty.name}
      </div>
      {counterparty.description && (
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
          {counterparty.description}
        </div>
      )}

      <div className="flex-1" />

      {contactName && (
        <Badge variant="outline" className="h-6 shrink-0">
          {contactName}
        </Badge>
      )}

      <Badge
        variant="outline"
        asChild
        className="h-6 shrink-0 hover:bg-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        <Link to="/accounts/$id" params={{ id: counterparty.account }}>
          <AccountLabel accountId={counterparty.account} />
        </Link>
      </Badge>

      <div className="text-right font-mono whitespace-nowrap sm:min-w-16">
        {currencyFormatter.format(getCounterpartyLiability())}
      </div>
    </Link>
  );
}
