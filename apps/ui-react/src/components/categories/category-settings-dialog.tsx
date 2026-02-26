import { zodResolver } from "@hookform/resolvers/zod";
import { ActivityType, type ActivityCategory } from "@maille/core/activities";
import { useNavigate } from "@tanstack/react-router";
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
import { EmojiPicker } from "@/components/ui/emoji-picker";
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

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(ActivityType),
  emoji: z.string().nullable().optional(),
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
  const activities = useActivities((state) => state.activities);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
      emoji: category.emoji,
    },
  });

  const onSubmit = async (data: UpdateCategoryFormValues) => {
    mutate({
      name: "updateActivityCategory",
      mutation: updateActivityCategoryMutation,
      variables: {
        id: category.id,
        name: data.name,
        emoji: data.emoji,
      },
      rollbackData: {
        id: category.id,
        name: category.name,
        emoji: category.emoji,
      },
      events: [
        {
          type: "updateActivityCategory",
          payload: {
            id: category.id,
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

  const handleDelete = async () => {
    mutate({
      name: "deleteActivityCategory",
      mutation: deleteActivityCategoryMutation,
      variables: {
        id: category.id,
      },
      rollbackData: {
        category: category,
        activities: activities
          .filter((a) => a.category === category.id)
          .map((a) => a.id),
        activitiesSubcategories: activities
          .filter((a) => a.category === category.id)
          .reduce(
            (acc, a) => {
              if (a.subcategory) {
                acc[a.id] = a.subcategory;
              }
              return acc;
            },
            {} as Record<string, string>,
          ),
      },
      events: [
        {
          type: "deleteActivityCategory",
          payload: {
            id: category.id,
          },
        },
      ],
    });

    await navigate({ to: "/categories" });
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

          <Field>
            <FieldLabel>Emoji</FieldLabel>
            <FieldContent>
              <Controller
                name="emoji"
                control={control}
                render={({ field }) => (
                  <EmojiPicker
                    value={field.value || null}
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
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this category? This action
                    cannot be undone.
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
