import { zodResolver } from "@hookform/resolvers/zod";
import type { Activity } from "@maille/core/activities";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { AccountSelect } from "@/components/accounts/account-select";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { addTransactionMutation } from "@/mutations/activities";
import { activitiesStore } from "@/stores/activities";
import { syncStore } from "@/stores/sync";

// Form schema using zod
const formSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  fromAccount: z.string().min(1, "From account is required"),
  toAccount: z.string().min(1, "To account is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTransactionButtonProps {
  activity: Activity;
  className?: string;
}

export function AddTransactionButton({
  activity,
  className,
}: AddTransactionButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      fromAccount: "",
      toAccount: "",
    },
  });

  const { control, handleSubmit, reset } = form;

  const handleAddTransaction = (data: FormValues) => {
    const transaction = activitiesStore
      .getState()
      .addNewTransaction(
        activity.id,
        data.amount,
        data.fromAccount,
        data.toAccount,
      );

    syncStore.getState().mutate({
      name: "addTransaction",
      mutation: addTransactionMutation,
      variables: {
        activityId: activity.id,
        ...transaction,
      },
      rollbackData: undefined,
    });

    reset();
    setShowDialog(false);
  };

  const resetDialog = () => {
    setShowDialog(false);
    reset();
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
            <DialogTitle className="font-medium text-white">
              Add a new transaction
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleAddTransaction)} className="py-4">
            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="mb-4">
                  <FieldLabel htmlFor="amount">Amount</FieldLabel>
                  <AmountInput
                    id="amount"
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full sm:w-56"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="fromAccount"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="mb-4">
                  <FieldLabel htmlFor="fromAccount">From account</FieldLabel>
                  <AccountSelect
                    modelValue={field.value}
                    onUpdateModelValue={field.onChange}
                    className="w-full sm:w-56"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="toAccount"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="mb-4">
                  <FieldLabel htmlFor="toAccount">To account</FieldLabel>
                  <AccountSelect
                    modelValue={field.value}
                    onUpdateModelValue={field.onChange}
                    className="w-full sm:w-56"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                className="bg-primary-700 hover:bg-primary-600"
              >
                Create transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
