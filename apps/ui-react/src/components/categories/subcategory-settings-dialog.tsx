import { zodResolver } from "@hookform/resolvers/zod";
import type { ActivitySubCategory } from "@maille/core/activities";
import { useState } from "react";
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
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import {
  updateActivitySubCategoryMutation,
  deleteActivitySubCategoryMutation,
} from "@/mutations/activities";
import { useActivities } from "@/stores/activities";
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

const updateSubcategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  emoji: z.string().nullable().optional(),
});

type UpdateSubcategoryFormValues = z.infer<typeof updateSubcategorySchema>;

export function SubcategorySettingsDialog({
  subcategory,
  children,
}: {
  subcategory: ActivitySubCategory;
  children?: React.ReactNode;
}) {
  const mutate = useSync((state) => state.mutate);
  const activities = useActivities((state) => state.activities);

  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSubcategoryFormValues>({
    resolver: zodResolver(updateSubcategorySchema),
    defaultValues: {
      name: subcategory.name,
      emoji: subcategory.emoji,
    },
  });

  const onSubmit = async (data: UpdateSubcategoryFormValues) => {
    mutate({
      name: "updateActivitySubCategory",
      mutation: updateActivitySubCategoryMutation,
      variables: {
        id: subcategory.id,
        name: data.name,
        emoji: data.emoji,
      },
      rollbackData: {
        ...subcategory,
        name: subcategory.name,
        emoji: subcategory.emoji,
      },
      events: [
        {
          type: "updateActivitySubCategory",
          payload: {
            id: subcategory.id,
            name: data.name,
            emoji: data.emoji,
          },
        },
      ],
    });

    reset({
      name: data.name,
    });
    setOpen(false);
  };

  const onDelete = async () => {
    mutate({
      name: "deleteActivitySubCategory",
      mutation: deleteActivitySubCategoryMutation,
      variables: {
        id: subcategory.id,
      },
      rollbackData: {
        subcategory: subcategory,
        activities: activities
          .filter((activity) => activity.subcategory === subcategory.id)
          .map((activity) => activity.id),
      },
      events: [
        {
          type: "deleteActivitySubCategory",
          payload: subcategory,
        },
      ],
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subcategory settings</DialogTitle>
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

          <Field>
            <FieldLabel>Emoji</FieldLabel>
            <FieldContent>
              <Controller
                name="emoji"
                control={control}
                render={({ field }) => (
                  <EmojiPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldContent>
          </Field>

          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Delete subcategory
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete subcategory</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this subcategory? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} variant="destructive">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex-1" />
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
