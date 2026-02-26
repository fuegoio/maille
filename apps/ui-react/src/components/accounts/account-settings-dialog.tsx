import { zodResolver } from "@hookform/resolvers/zod";
import { type Account } from "@maille/core/accounts";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
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
  deleteAccountMutation,
  updateAccountMutation,
} from "@/mutations/accounts";
import { useAuth } from "@/stores/auth";
import { useSync } from "@/stores/sync";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

const accountSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startingBalance: z.number().nullable().optional(),
  startingCashBalance: z.number().nullable().optional(),
  movements: z.boolean(),
});

type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>;

export function AccountSettingsDialog({
  account,
  children,
}: {
  account: Account;
  children?: React.ReactNode;
}) {
  const mutate = useSync((state) => state.mutate);
  const user = useAuth((state) => state.user);
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      name: account.name,
      startingBalance: account.startingBalance ?? null,
      startingCashBalance: account.startingCashBalance ?? null,
      movements: account.movements,
    },
  });

  const onSubmit = async (data: AccountSettingsFormValues) => {
    mutate({
      name: "updateAccount",
      mutation: updateAccountMutation,
      variables: {
        id: account.id,
        ...data,
      },
      rollbackData: {
        ...account,
      },
      events: [
        {
          type: "updateAccount",
          payload: {
            id: account.id,
            ...data,
          },
        },
      ],
    });
  };

  const handleDelete = async () => {
    mutate({
      name: "deleteAccount",
      mutation: deleteAccountMutation,
      variables: {
        id: account.id,
      },
      rollbackData: {
        ...account,
      },
      events: [
        {
          type: "deleteAccount",
          payload: {
            id: account.id,
          },
        },
      ],
    });
    await navigate({ to: "/accounts" });
  };

  const movementsEnabled = watch("movements");

  return (
    <Dialog>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Account settings</DialogTitle>
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
                    />
                  )}
                />
                <FieldError errors={[errors.name]} />
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
            {!account.default && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this account? This action
                      cannot be undone and will remove all transactions from or
                      to this account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      variant="destructive"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="flex-1" />
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
