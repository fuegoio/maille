import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
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
import { createAssetMutation } from "@/mutations/assets";
import { useSync } from "@/stores/sync";
import { useWorkspaces } from "@/stores/workspaces";

// Define the form schema for creating an asset
const createAssetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  location: z.string().optional(),
});

type CreateAssetFormValues = z.infer<typeof createAssetSchema>;

interface AddAssetModalProps {
  accountId: string;
  children: ReactNode;
}

export function AddAssetModal({ accountId, children }: AddAssetModalProps) {
  const workspaceId = useWorkspaces((state) => state.currentWorkspace!.id);
  const mutate = useSync((state) => state.mutate);

  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
    },
  });

  const onSubmit = async (data: CreateAssetFormValues) => {
    const asset = {
      id: crypto.randomUUID(),
      account: accountId,
      name: data.name,
      description: data.description || null,
      location: data.location || null,
      workspace: workspaceId,
    };

    mutate({
      name: "createAsset",
      mutation: createAssetMutation,
      variables: asset,
      rollbackData: undefined,
      events: [
        {
          type: "createAsset",
          payload: asset,
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
          <DialogTitle>Add new asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <Input
                {...register("name")}
                placeholder="e.g., Laptop, Desk Chair"
                autoFocus
              />
            </FieldContent>
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Location (optional)</FieldLabel>
            <FieldContent>
              <Input
                {...register("location")}
                placeholder="e.g., Downtown, 123 Main St"
              />
            </FieldContent>
            <FieldDescription>Where is this asset located?</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Description (optional)</FieldLabel>
            <FieldContent>
              <Textarea
                {...register("description")}
                placeholder="Add any additional details about this asset..."
                rows={3}
              />
            </FieldContent>
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

