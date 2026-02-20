import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { UserSelect } from "@/components/users/user-select";
import { createCounterpartyMutation } from "@/mutations/counterparties";
import { useSync } from "@/stores/sync";
import { useWorkspaces } from "@/stores/workspaces";

// Define the form schema for creating a counterparty
const createCounterpartySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  user: z.string().optional(),
});

type CreateCounterpartyFormValues = z.infer<typeof createCounterpartySchema>;

interface AddCounterpartyModalProps {
  accountId: string;
  children: ReactNode;
}

export function AddCounterpartyModal({
  accountId,
  children,
}: AddCounterpartyModalProps) {
  const workspaceId = useWorkspaces((state) => state.currentWorkspace!.id);
  const mutate = useSync((state) => state.mutate);

  const [isOpen, setIsOpen] = useState(false);

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    control,
  } = useForm<CreateCounterpartyFormValues>({
    resolver: zodResolver(createCounterpartySchema),
    defaultValues: {
      name: "",
      description: "",
      user: "",
    },
  });

  const onSubmit = async (data: CreateCounterpartyFormValues) => {
    const counterparty = {
      id: crypto.randomUUID(),
      account: accountId,
      name: data.name,
      description: data.description || null,
      user: data.user || null,
      workspace: workspaceId,
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

          <Controller
            name="user"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>User (optional)</FieldLabel>
                <FieldContent>
                  <UserSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FieldContent>
                <FieldDescription>
                  Link this counterparty to a user in this workspace.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
