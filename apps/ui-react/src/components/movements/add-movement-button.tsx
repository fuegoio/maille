import { zodResolver } from "@hookform/resolvers/zod";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Plus } from "lucide-react";
import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { AccountSelect } from "@/components/accounts/account-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGraphQLDate } from "@/lib/date";
import { createMovementMutation } from "@/mutations/movements";
import { useSync } from "@/stores/sync";

import { AmountInput } from "../ui/amount-input";
import { DatePicker } from "../ui/date-picker";

// Form schema using zod
const formSchema = z.object({
  date: z.date(),
  amount: z.number(),
  account: z.string().min(1, "Account is required"),
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMovementButtonProps {
  className?: string;
  size?: "sm" | "default";
}

export function AddMovementButton({ className, size }: AddMovementButtonProps) {
  const mutate = useSync((state) => state.mutate);
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
    const movement = {
      id: crypto.randomUUID(),
      ...data,
      date: getGraphQLDate(data.date),
    };

    mutate({
      name: "createMovement",
      mutation: createMovementMutation,
      variables: movement,
      rollbackData: undefined,
      events: [
        {
          type: "createMovement",
          payload: movement,
        },
      ],
    });

    closeDialog();
  };

  // Hotkeys
  useHotkey("C", (event) => {
    if (event.key !== "c") return;
    openDialog();
  });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={size === "sm" ? "icon-sm" : "icon"}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new movement</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(addNewMovement)}>
            <FieldGroup className="pb-8">
              <Controller
                name="date"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="date">Date</FieldLabel>
                    <DatePicker {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Movement name</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Restaurant"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="amount"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="amount">Amount</FieldLabel>
                    <AmountInput {...field} mode="field" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                      value={field.value}
                      onChange={field.onChange}
                      movementsOnly
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button type="submit">Create movement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
