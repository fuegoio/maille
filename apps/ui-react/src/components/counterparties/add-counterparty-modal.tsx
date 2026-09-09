import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType } from "@maille/core/accounts";
import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
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
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserSelect } from "@/components/users/user-select";
import { createCounterpartyMutation } from "@/mutations/counterparties";
import { useAccounts } from "@/stores/accounts";
import { useSync } from "@/stores/sync";

const createCounterpartySchema = z.object({
  name: z.string().min(1, "Name is required"),
  account: z.string().min(1, "Account is required"),
  description: z.string().optional(),
  contact: z.string().optional(),
  initialBalance: z.number().optional(),
});

type CreateCounterpartyFormValues = z.infer<typeof createCounterpartySchema>;

interface AddCounterpartyModalProps {
  children: ReactNode;
  accountId?: string;
}

export function AddCounterpartyModal({
  children,
  accountId,
}: AddCounterpartyModalProps) {
  const mutate = useSync((state) => state.mutate);
  const accounts = useAccounts((state) => state.accounts);
  const [isOpen, setIsOpen] = useState(false);

  const liabilityAccounts = useMemo(
    () => accounts.filter((a) => a.type === AccountType.LIABILITIES),
    [accounts],
  );

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    control,
  } = useForm<CreateCounterpartyFormValues>({
    resolver: zodResolver(createCounterpartySchema),
    defaultValues: {
      name: "",
      account: accountId ?? "",
      description: "",
      contact: "",
      initialBalance: undefined,
    },
  });

  const onSubmit = async (data: CreateCounterpartyFormValues) => {
    const counterparty = {
      id: crypto.randomUUID(),
      account: data.account,
      name: data.name,
      description: data.description || null,
      contact: data.contact || null,
      initialBalance: data.initialBalance ?? null,
    };

    mutate({
      name: "createCounterparty",
      mutation: createCounterpartyMutation,
      variables: counterparty,
      rollbackData: undefined,
      events: [
        {
          type: "createCounterparty",
          payload: counterparty,
        },
      ],
    });

    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new counterparty</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <Input {...field} autoFocus />
                </FieldContent>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {!accountId && (
            <Controller
              name="account"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Account</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a liability account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Liabilities</SelectLabel>
                          {liabilityAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}

          <Controller
            name="contact"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Contact (optional)</FieldLabel>
                <FieldContent>
                  <UserSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FieldContent>
                <FieldDescription>
                  Link this counterparty to a contact.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="initialBalance"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Initial balance (optional)</FieldLabel>
                <FieldContent>
                  <AmountInput
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    mode="field"
                  />
                </FieldContent>
                <FieldDescription>
                  Amount already owed before any transactions.
                </FieldDescription>
              </Field>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Description (optional)</FieldLabel>
                <FieldContent>
                  <Textarea
                    {...field}
                    placeholder="Add any additional details about this counterparty..."
                    rows={3}
                  />
                </FieldContent>
              </Field>
            )}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create counterparty"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
