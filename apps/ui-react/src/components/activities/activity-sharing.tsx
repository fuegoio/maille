import { type Activity } from "@maille/core/activities";
import { CircleCheck, Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { UserAvatar } from "@/components/users/user-avatar";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { shareActivityMutation } from "@/mutations/activities";
import { useContacts } from "@/stores/contacts";
import { useCounterparties } from "@/stores/counterparties";
import { useSync } from "@/stores/sync";

import { AccountLabel } from "../accounts/account-label";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Field, FieldGroup } from "../ui/field";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { UserSelect } from "../users/user-select";

interface ActivitySharingProps {
  activity: Activity;
}

export function ActivitySharing({ activity }: ActivitySharingProps) {
  const currencyFormatter = useCurrencyFormatter();
  const counterparties = useCounterparties((state) => state.counterparties);
  const contacts = useContacts((state) => state.contacts);
  const mutate = useSync((state) => state.mutate);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUser, setShareUser] = useState("");
  const shareActivity = () => {
    mutate({
      name: "shareActivity",
      mutation: shareActivityMutation,
      variables: {
        id: activity.id,
        userId: shareUser,
      },
      rollbackData: undefined,
      events: [
        {
          type: "updateActivitySharing",
          payload: {
            activityId: activity.id,
            sharing: [
              ...activity.sharing,
              {
                user: shareUser,
                liability: 0,
                accounts: [],
              },
            ],
          },
        },
      ],
    });
    setShareUser("");
    setShareDialogOpen(false);
  };

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

  const getCurrentAccountAmount = (account: string) => {
    return activity.transactions.reduce((acc, transaction) => {
      if (transaction.fromAccount === account) {
        acc -= transaction.amount;
      }
      if (transaction.toAccount === account) {
        acc += transaction.amount;
      }
      return acc;
    }, 0);
  };

  // Check if all users are reconciled (both liability and accounts)
  const isReconciled =
    activity.sharing?.every((sharing) => {
      const currentAmount = currentAmounts[sharing.user] || 0;
      const liabilityReconciled =
        Math.abs(currentAmount - sharing.liability) < 0.01;

      // Check if all accounts are reconciled
      const accountsReconciled = sharing.accounts.every((accountSharing) => {
        const currentAccountAmount = getCurrentAccountAmount(
          accountSharing.account,
        );
        return Math.abs(currentAccountAmount - accountSharing.amount) < 0.01;
      });

      return liabilityReconciled && accountsReconciled;
    }) || false;

  return (
    <div className="border-b px-4 py-6 sm:px-8">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">Sharing</div>
        <div className="flex-1" />
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share this activity</DialogTitle>
              <DialogDescription>
                Sharing this activity will link it to an activity for one of
                your contact.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="contact">Contact</Label>
                <UserSelect
                  id="contact"
                  value={shareUser}
                  onValueChange={setShareUser}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={shareActivity}>Share</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!isReconciled ? (
          <TriangleAlert className="mr-1.5 size-5 text-orange-300" />
        ) : (
          <CircleCheck className="mr-1.5 size-5 text-indigo-400" />
        )}
      </div>

      <div className="my-2">
        {activity.sharing.map((sharing) => {
          const currentAmount = currentAmounts[sharing.user] || 0;
          const userAmountReconciled =
            Math.abs(currentAmount - sharing.liability) < 0.01;

          const user = contacts.find(
            (u) => u.contact.id === sharing.user,
          )?.contact;
          if (!user) return null;
          return (
            <div key={sharing.user} className="py-2">
              <div className="flex items-center">
                <div className="mr-3 flex items-center">
                  <UserAvatar user={user} className="mr-2 h-6 w-6" />
                  <span className="text-sm">{user.name}</span>
                </div>
                <div className="flex-1" />
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      className={cn(
                        "px-2 font-mono text-sm whitespace-nowrap",
                        userAmountReconciled
                          ? "text-indigo-400"
                          : "text-orange-300",
                      )}
                    >
                      {currencyFormatter.format(currentAmount)}/
                      {currencyFormatter.format(sharing.liability)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    This amount is determined by the transactions going to and
                    from {user.name} liabilities.
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Account sharing details */}
              {sharing.accounts.length > 0 && (
                <div className="ml-8 space-y-1 border-t pl-2">
                  {sharing.accounts.map((accountSharing) => {
                    const currentAccountAmount = getCurrentAccountAmount(
                      accountSharing.account,
                    );
                    const accountReconciled =
                      Math.abs(currentAccountAmount - accountSharing.amount) <
                      0.01;

                    return (
                      <div
                        key={accountSharing.account}
                        className="flex items-center"
                      >
                        <AccountLabel accountId={accountSharing.account} />
                        <div className="flex-1" />
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              className={cn(
                                "px-2 font-mono text-xs whitespace-nowrap",
                                accountReconciled
                                  ? "text-indigo-400"
                                  : "text-orange-300",
                              )}
                            >
                              {currencyFormatter.format(currentAccountAmount)}/
                              {currencyFormatter.format(accountSharing.amount)}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            This amount is determined by the transactions going
                            to and from this account which is shared with{" "}
                            {user.name}.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
