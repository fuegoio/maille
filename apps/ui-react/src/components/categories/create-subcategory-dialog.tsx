import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
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
import { createActivitySubCategoryMutation } from "@/mutations/activities";
import { useSync } from "@/stores/sync";

const createSubcategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  emoji: z.string().nullable().optional(),
});

type CreateSubcategoryFormValues = z.infer<typeof createSubcategorySchema>;

export function CreateSubcategoryDialog({
  categoryId,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialName = "",
  onSubcategoryCreated,
}: {
  categoryId: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialName?: string;
  onSubcategoryCreated?: (subcategoryId: string) => void;
}) {
  const mutate = useSync((state) => state.mutate);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? setInternalOpen)
    : setInternalOpen;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubcategoryFormValues>({
    resolver: zodResolver(createSubcategorySchema),
    defaultValues: {
      name: initialName,
      emoji: null,
    },
  });

  React.useEffect(() => {
    if (open) {
      setValue("name", initialName);
    }
  }, [open, initialName, setValue]);

  const onSubmit = async (data: CreateSubcategoryFormValues) => {
    try {
      const subcategory = {
        id: crypto.randomUUID(),
        name: data.name,
        category: categoryId,
        emoji: data.emoji || null,
      };

      mutate({
        name: "createActivitySubCategory",
        mutation: createActivitySubCategoryMutation,
        variables: {
          ...subcategory,
        },
        rollbackData: undefined,
        events: [
          {
            type: "createActivitySubCategory",
            payload: subcategory,
          },
        ],
      });

      onSubcategoryCreated?.(subcategory.id);

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
                      placeholder="Subcategory name"
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
              {isSubmitting ? "Creating..." : "Create Subcategory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
