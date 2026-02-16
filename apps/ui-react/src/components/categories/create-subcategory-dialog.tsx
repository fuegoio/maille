import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createActivitySubCategoryMutation } from "@/mutations/activities";
import { useSync } from "@/stores/sync";
import { useWorkspaces } from "@/stores/workspaces";
import { randomstring } from "@/lib/utils";

const createSubcategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CreateSubcategoryFormValues = z.infer<typeof createSubcategorySchema>;

export function CreateSubcategoryDialog({
  categoryId,
  children,
}: {
  categoryId: string;
  children?: React.ReactNode;
}) {
  const mutate = useSync((state) => state.mutate);
  const workspace = useWorkspaces((state) => state.currentWorkspace);
  const [open, setOpen] = useState(false);

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubcategoryFormValues>({
    resolver: zodResolver(createSubcategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateSubcategoryFormValues) => {
    try {
      const subcategory = {
        id: randomstring(),
        name: data.name,
        category: categoryId,
      };

      mutate({
        name: "createActivitySubCategory",
        mutation: createActivitySubCategoryMutation,
        variables: {
          ...subcategory,
          workspace: workspace.id,
        },
        rollbackData: undefined,
        events: [
          {
            type: "createActivitySubCategory",
            payload: subcategory,
          },
        ],
      });

      // Reset form and close dialog on success
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to create subcategory:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Subcategory</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Subcategory name"
                    className={errors.name ? "border-destructive" : ""}
                    autoFocus
                  />
                )}
              />
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Subcategory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}