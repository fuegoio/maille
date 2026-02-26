import { zodResolver } from "@hookform/resolvers/zod";
import { ACCOUNT_TYPES, AccountType } from "@maille/core/accounts";
import { format } from "date-fns";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createAccountMutation } from "@/mutations/accounts";
import { ACCOUNT_TYPES_COLOR, ACCOUNT_TYPES_NAME } from "@/stores/accounts";
import { useAuth } from "@/stores/auth";
import { useSync } from "@/stores/sync";

const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(AccountType),
  startingBalance: z.number().nullable().optional(),
  startingCashBalance: z.number().nullable().optional(),
  movements: z.boolean(),
});

type CreateAccountFormValues = z.infer<typeof createAccountSchema>;

export function CreateAccountDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const mutate = useSync((state) => state.mutate);
  const user = useAuth((state) => state.user);
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: "",
      type: AccountType.BANK_ACCOUNT,
      startingBalance: null,
      startingCashBalance: null,
      movements: true,
    },
  });

  const onSubmit = async (data: CreateAccountFormValues) => {
    try {
      const account = {
        id: crypto.randomUUID(),
        name: data.name,
        type: data.type,
      };

      mutate({
        name: "createAccount",
        mutation: createAccountMutation,
        variables: {
          ...account,
          startingCashBalance: data.movements ? data.startingCashBalance : null,
        },
        rollbackData: undefined,
        events: [
          {
            type: "createAccount",
            payload: {
              ...account,
              startingBalance: data.startingBalance ?? null,
              startingCashBalance: data.movements
                ? (data.startingCashBalance ?? null)
                : null,
              movements: data.movements,
            },
          },
        ],
      });

      // Reset form and close dialog on success
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to create account:", error);
    }
  };

  const movementsEnabled = watch("movements");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Account name"
                      className={errors.name ? "border-destructive" : ""}
                      autoFocus
                    />
                  )}
                />
                <FieldError errors={[errors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Account Type</FieldLabel>
              <FieldContent>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setValue(
                          "movements",
                          value === AccountType.BANK_ACCOUNT,
                        );
                      }}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div
                              className={cn(
                                "mr-2 h-3 w-3 shrink-0 rounded-xl",
                                ACCOUNT_TYPES_COLOR[type],
                              )}
                            />
                            <div className="text-sm font-medium">
                              {ACCOUNT_TYPES_NAME[type]}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Starting balance</FieldLabel>
              <FieldContent>
                <Controller
                  name="startingBalance"
                  control={control}
                  render={({ field }) => (
                    <AmountInput
                      value={field.value ?? 0}
                      onChange={field.onChange}
                      mode="field"
                    />
                  )}
                />
                <FieldDescription>
                  The initial balance of this account in{" "}
                  {format(user!.startingDate, "MMMM yyyy")}.
                </FieldDescription>
              </FieldContent>
            </Field>

            <FieldSeparator />
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel>Movements enabled</FieldLabel>
                <FieldDescription>
                  Enable to allow movements for this account
                </FieldDescription>
              </FieldContent>
              <Controller
                name="movements"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field
              className={
                movementsEnabled ? "" : "pointer-events-none opacity-50"
              }
            >
              <FieldLabel>Starting cash balance</FieldLabel>
              <FieldContent>
                <Controller
                  name="startingCashBalance"
                  control={control}
                  render={({ field }) => (
                    <AmountInput
                      value={field.value ?? 0}
                      onChange={field.onChange}
                      mode="field"
                      disabled={!movementsEnabled}
                    />
                  )}
                />
                <FieldDescription>
                  The initial cash balance for this account in{" "}
                  {format(user!.startingDate, "MMMM yyyy")}.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
