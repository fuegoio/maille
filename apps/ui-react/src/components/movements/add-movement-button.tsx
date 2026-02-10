import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import { movementsStore } from "@/stores/movements";
import { syncStore } from "@/stores/sync";
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
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

// Form schema using zod
const formSchema = z.object({
  date: z.date(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  account: z.string().min(1, "Account is required"),
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMovementButtonProps {
  className?: string;
}

export function AddMovementButton({ className }: AddMovementButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      account: "",
      name: "",
    },
  });

  const { control, handleSubmit, reset } = form;

  const openDialog = () => {
    reset({
      date: new Date(),
      amount: 0,
      account: "",
      name: "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const addNewMovement = async (data: FormValues) => {
    const movement = movementsStore.getState().addMovement({
      date: data.date,
      amount: data.amount,
      account: data.account,
      name: data.name,
      activities: [],
    });

    syncStore.getState().sendEvent({
      name: "createMovement",
      mutation: createMovementMutation,
      variables: {
        id: movement.id,
        name: movement.name,
        date: movement.date.toISOString().split("T")[0],
        account: movement.account,
        amount: movement.amount,
      },
      rollbackData: undefined,
    });

    closeDialog();
  };

  // Hotkeys
  useHotkeys("c", () => {
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
          <form onSubmit={handleSubmit(addNewMovement)} className="grid gap-4 py-4">
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="date">Date</FieldLabel>
                  <Input
                    id="date"
                    type="date"
                    value={field.value.toISOString().split("T")[0]}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    className="bg-primary-800 w-full rounded-md border px-3 py-2 text-white"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="amount">Amount</FieldLabel>
                  <Input
                    id="amount"
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    step="0.01"
                    className="bg-primary-800 w-full rounded-md border px-3 py-2 text-white"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="account"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="account">Account</FieldLabel>
                  <AccountSelect
                    modelValue={field.value}
                    onUpdateModelValue={field.onChange}
                    movementsOnly
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Restaurant"
                    className="bg-primary-800 w-full rounded-md border px-3 py-2 text-white"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <DialogFooter>
              <Button type="submit">
                Create movement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
