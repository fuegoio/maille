import * as React from "react";

import { movementsStore } from "@/stores/movements";
import { eventsStore } from "@/stores/events";
import { createMovementMutation } from "@/mutations/movements";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AccountSelect } from "@/components/accounts/account-select";
import type { UUID } from "crypto";

interface AddMovementButtonProps {
  className?: string;
}

export function AddMovementButton({ className }: AddMovementButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    date: new Date(),
    amount: 0,
    account: undefined as UUID | undefined,
    name: "",
  });

  const openDialog = () => {
    setFormData({
      date: new Date(),
      amount: 0,
      account: undefined,
      name: "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addNewMovement = async () => {
    if (formData.amount === 0 || !formData.account || !formData.name) return;

    const movement = movementsStore.getState().addMovement({
      date: formData.date,
      amount: formData.amount,
      account: formData.account,
      name: formData.name,
      activities: [],
    });

    eventsStore.getState().sendEvent({
      name: "createMovement",
      mutation: createMovementMutation,
      variables: {
        id: movement.id,
        name: movement.name,
        date: movement.date.toISOString().split('T')[0],
        account: movement.account,
        amount: movement.amount,
      },
      rollbackData: undefined,
    });

    closeDialog();
  };

  // Hotkeys
  useHotkeys('c', () => {
    openDialog();
  });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={className}
            onClick={openDialog}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add a new movement</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add a new movement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="date" className="text-right text-sm text-primary-100">
                Date
              </label>
              <div className="col-span-3">
                <input
                  id="date"
                  type="date"
                  value={formData.date.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('date', new Date(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md bg-primary-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="amount" className="text-right text-sm text-primary-100">
                Amount
              </label>
              <div className="col-span-3">
                <input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md bg-primary-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="account" className="text-right text-sm text-primary-100">
                Account
              </label>
              <div className="col-span-3">
                <AccountSelect
                  modelValue={formData.account}
                  onUpdateModelValue={(value) => handleInputChange('account', value)}
                  movementsOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm text-primary-100">
                Name
              </label>
              <div className="col-span-3">
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Restaurant"
                  className="w-full px-3 py-2 border rounded-md bg-primary-800 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={addNewMovement}>
              Create movement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}