import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { activitiesStore } from "@/stores/activities";
import { eventsStore } from "@/stores/events";
import { addTransactionMutation } from "@/mutations/activities";
import { AccountSelect } from "@/components/accounts/account-select";
import { AmountInput } from "@/components/ui/amount-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UUID } from "crypto";
import type { Activity } from "@maille/core/activities";

interface AddTransactionButtonProps {
  activity: Activity;
  className?: string;
}

export function AddTransactionButton({ activity, className }: AddTransactionButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [fromAccount, setFromAccount] = useState<UUID | null>(null);
  const [toAccount, setToAccount] = useState<UUID | null>(null);

  const resetDialog = () => {
    setShowDialog(false);
    setAmount(undefined);
    setFromAccount(null);
    setToAccount(null);
  };

  const handleAddTransaction = () => {
    if (amount === undefined || fromAccount === null || toAccount === null) return;

    const transaction = activitiesStore
      .getState()
      .addNewTransaction(activity.id, amount, fromAccount, toAccount);

    eventsStore.getState().sendEvent({
      name: "addTransaction",
      mutation: addTransactionMutation,
      variables: {
        activityId: activity.id,
        ...transaction,
      },
      rollbackData: undefined,
    });

    resetDialog();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setShowDialog(true)}
            className={className}
            variant="outline"
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add a transaction</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={showDialog} onOpenChange={resetDialog}>
        <DialogContent className="bg-primary-800 border-primary-700 max-w-xl text-white">
          <DialogHeader>
            <DialogTitle className="font-medium text-white">Add a new transaction</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 flex flex-col text-sm sm:flex-row sm:items-center">
              <div className="text-primary-100 mb-2 text-sm sm:mb-0">Amount</div>
              <div className="flex-1" />
              <AmountInput value={amount || 0} onChange={setAmount} className="w-full sm:w-56" />
            </div>

            <div className="mb-4 flex flex-col text-sm sm:flex-row sm:items-center">
              <div className="text-primary-100 mb-2 text-sm sm:mb-0">From account</div>
              <div className="flex-1" />
              <AccountSelect
                modelValue={fromAccount}
                onUpdateModelValue={setFromAccount}
                className="w-full sm:w-56"
              />
            </div>

            <div className="mb-4 flex flex-col text-sm sm:flex-row sm:items-center">
              <div className="text-primary-100 mb-2 text-sm sm:mb-0">To account</div>
              <div className="flex-1" />
              <AccountSelect
                modelValue={toAccount}
                onUpdateModelValue={setToAccount}
                className="w-full sm:w-56"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddTransaction} className="bg-primary-700 hover:bg-primary-600">
              Create transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
