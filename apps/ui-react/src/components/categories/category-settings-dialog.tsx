import { zodResolver } from "@hookform/resolvers/zod";
import { ActivityType, type ActivityCategory } from "@maille/core/activities";
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
import {
  updateActivityCategoryMutation,
  deleteActivityCategoryMutation,
} from "@/mutations/activities";
import { useSync } from "@/stores/sync";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(ActivityType),
});

type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;

export function CategorySettingsDialog({
  children,
  category,
}: {
  children?: React.ReactNode;
  category: ActivityCategory;
}) {
  const mutate = useSync((state) => state.mutate);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCategoryFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: category.name,
      type: category.type,
    },
  });

  const onSubmit = async (data: UpdateCategoryFormValues) => {
    try {
      mutate({
        name: "updateActivityCategory",
        mutation: updateActivityCategoryMutation,
        variables: {
          id: category.id,
          name: data.name,
        },
        rollbackData: {
          id: category.id,
          name: category.name,
        },
        events: [
          {
            type: "updateActivityCategory",
            payload: {
              id: category.id,
              name: data.name,
            },
          },
        ],
      });

      // Reset form and close dialog on success
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      mutate({
        name: "deleteActivityCategory",
        mutation: deleteActivityCategoryMutation,
        variables: {
          id: category.id,
        },
        rollbackData: {
          category: category,
          activities: [],
          activitiesSubcategories: {},
        },
      });

      setOpen(false);
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Category settings</DialogTitle>
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
                    placeholder="Category name"
                    className={errors.name ? "border-destructive" : ""}
                    autoFocus
                  />
                )}
              />
              <FieldError errors={[errors.name]} />
            </FieldContent>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete category"}
            </Button>
            <div className="flex-1" />
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

