import { type Activity } from "@maille/core/activities";
import { CircleCheck, TriangleAlert } from "lucide-react";

import { UserAvatar } from "@/components/users/user-avatar";
import { cn } from "@/lib/utils";
import { getCurrencyFormatter } from "@/lib/utils";
import { useContacts } from "@/stores/contacts";
import { useCounterparties } from "@/stores/counterparties";

interface ActivityLiabilitiesProps {
  activity: Activity;
}

export function ActivityLiabilities({ activity }: ActivityLiabilitiesProps) {
  const currencyFormatter = getCurrencyFormatter();
  const counterparties = useCounterparties((state) => state.counterparties);
  const contacts = useContacts((state) => state.contacts);

  // Compute current amounts from transactions and counterparties
  const computeCurrentAmounts = () => {
    const userAmounts: Record<string, number> = {};

    // Process transactions
    for (const transaction of activity.transactions) {
      // Check if transaction involves a liability account with counterparty
      const fromCounterparty = transaction.fromCounterparty
        ? counterparties.find((c) => c.id === transaction.fromCounterparty)
        : null;
      const toCounterparty = transaction.toCounterparty
        ? counterparties.find((c) => c.id === transaction.toCounterparty)
        : null;

      // If from transaction has a counterparty linked to a user, subtract from that user
      if (fromCounterparty?.contact) {
        userAmounts[fromCounterparty.contact] =
          (userAmounts[fromCounterparty.contact] || 0) - transaction.amount;
      }

      // If to transaction has a counterparty linked to a user, add to that user
      if (toCounterparty?.contact) {
        userAmounts[toCounterparty.contact] =
          (userAmounts[toCounterparty.contact] || 0) + transaction.amount;
      }
    }

    return userAmounts;
  };

  const currentAmounts = computeCurrentAmounts();

  // Check if all users are reconciled
  const isReconciled =
    activity.liabilities?.every((liability) => {
      const currentAmount = currentAmounts[liability.user] || 0;
      return Math.abs(currentAmount - liability.amount) < 0.01;
    }) || false;

  if (!activity.liabilities || activity.liabilities.length === 0) return null;

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="flex items-center">
        <div className="text-sm font-medium">Liabilities</div>
        <div className="flex-1" />
        {!isReconciled ? (
          <TriangleAlert className="mr-1.5 size-5 text-orange-300" />
        ) : (
          <CircleCheck className="mr-1.5 size-5 text-indigo-400" />
        )}
      </div>

      <div className="my-2">
        {activity.liabilities?.map((liability) => {
          const currentAmount = currentAmounts[liability.user] || 0;
          const userAmountReconciled =
            Math.abs(currentAmount - liability.amount) < 0.01;

          const user = contacts.find(
            (u) => u.contact.id === liability.user,
          )?.contact;
          if (!user) return null;
          return (
            <div key={liability.user} className="flex items-center py-2">
              <div className="mr-3 flex items-center">
                <UserAvatar user={user} className="mr-2 h-6 w-6" />
                <span className="text-sm">
                  {user?.name || `User ${liability.user.slice(0, 6)}...`}
                </span>
              </div>
              <div className="flex-1" />
              <div
                className={cn(
                  "pr-2 font-mono text-sm whitespace-nowrap",
                  userAmountReconciled ? "text-indigo-400" : "text-orange-300",
                )}
              >
                {currencyFormatter.format(currentAmount)}/
                {currencyFormatter.format(liability.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
