import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
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
import { createActivityCategoryMutation } from "@/mutations/activities";
import { useSync } from "@/stores/sync";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  emoji: z.string().nullable().optional(),
});

type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

interface CreateCategoryDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  initialName?: string;
  onCategoryCreated?: (categoryId: string) => void;
}

export function CreateCategoryDialog({
  open: externalOpen,
  onOpenChange,
  children,
  initialName = "",
  onCategoryCreated,
}: CreateCategoryDialogProps) {
  const mutate = useSync((state) => state.mutate);
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: initialName,
      emoji: null,
    },
  });

  // Update form values when props change
  useEffect(() => {
    setValue("name", initialName);
  }, [initialName, setValue]);

  const onSubmit = async (data: CreateCategoryFormValues) => {
    try {
      const category = {
        id: crypto.randomUUID(),
        name: data.name,
        emoji: data.emoji || null,
      };

      mutate({
        name: "createActivityCategory",
        mutation: createActivityCategoryMutation,
        variables: {
          ...category,
        },
        rollbackData: undefined,
        events: [
          {
            type: "createActivityCategory",
            payload: category,
          },
        ],
      });

      // Call callback with the new category ID
      if (onCategoryCreated) {
        onCategoryCreated(category.id);
      }

      // Reset form and close dialog on success
      reset();
      setOpen(false);
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  return (
    <Dialog
      open={externalOpen !== undefined ? externalOpen : open}
      onOpenChange={(open) => {
        setOpen(open);
        if (onOpenChange) {
          onOpenChange(open);
        }
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-end gap-2">
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
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
