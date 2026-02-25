import { zodResolver } from "@hookform/resolvers/zod";
import { ActivityType } from "@maille/core/activities";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { createActivityCategoryMutation } from "@/mutations/activities";
import { ACTIVITY_TYPES_COLOR, ACTIVITY_TYPES_NAME } from "@/stores/activities";
import { useSync } from "@/stores/sync";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(ActivityType),
});

type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

export function CreateCategoryDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const mutate = useSync((state) => state.mutate);
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      type: ActivityType.EXPENSE,
    },
  });

  const onSubmit = async (data: CreateCategoryFormValues) => {
    try {
      const category = {
        id: crypto.randomUUID(),
        name: data.name,
        type: data.type,
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

      // Reset form and close dialog on success
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
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
            <FieldLabel>Activity Type</FieldLabel>
            <FieldContent>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ActivityType).map((type) => (
                        <SelectItem key={type} value={type}>
                          <div
                            className={cn(
                              "mr-2 h-3 w-3 shrink-0 rounded-xl",
                              ACTIVITY_TYPES_COLOR[type],
                            )}
                          />
                          <div className="text-sm font-medium">
                            {ACTIVITY_TYPES_NAME[type]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              {isSubmitting ? "Creating..." : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

