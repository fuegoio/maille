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
import { EmojiPicker } from "@/components/ui/emoji-picker";
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
}: {
  categoryId: string;
  children?: React.ReactNode;
}) {
  const mutate = useSync((state) => state.mutate);
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubcategoryFormValues>({
    resolver: zodResolver(createSubcategorySchema),
    defaultValues: {
      name: "",
      emoji: null,
    },
  });

  const onSubmit = async (data: CreateSubcategoryFormValues) => {
    try {
      const subcategory = {
        id: crypto.randomUUID(),
        name: data.name,
        category: categoryId,
        emoji: data.emoji,
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