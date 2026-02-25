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

  // Check if all users are reconciled
  const isReconciled =
    activity.sharing?.every((sharing) => {
      const currentAmount = currentAmounts[sharing.user] || 0;
      return Math.abs(currentAmount - sharing.liability) < 0.01;
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
            <div key={sharing.user} className="flex items-center py-2">
              <div className="mr-3 flex items-center">
                <UserAvatar user={user} className="mr-2 h-6 w-6" />
                <span className="text-sm">
                  {user?.name || `User ${sharing.user.slice(0, 6)}...`}
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
                {currencyFormatter.format(sharing.liability)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
