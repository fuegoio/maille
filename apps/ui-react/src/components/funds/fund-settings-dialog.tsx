import type { Fund } from "@maille/core/funds";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { deleteFundMutation, updateFundMutation } from "@/mutations/funds";
import { useSync } from "@/stores/sync";

const updateFundSchema = z
  .object({
    name: z.string().min(1, "Fund name is required"),
    emoji: z.string().nullable().optional(),
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    { message: "End date must be after start date", path: ["endDate"] },
  );

type UpdateFundFormValues = z.infer<typeof updateFundSchema>;

interface FundSettingsDialogProps {
  fund: Fund;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function FundSettingsDialog({
  fund,
  open: externalOpen,
  onOpenChange,
  children,
}: FundSettingsDialogProps) {
  const mutate = useSync((state) => state.mutate);
  const [open, setOpen] = useState(false);

  const toDate = (value: Date | string | null | undefined): Date | null => {
    if (!value) return null;
    return value instanceof Date ? value : new Date(value);
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateFundFormValues>({
    resolver: zodResolver(updateFundSchema),
    defaultValues: {
      name: fund.name,
      emoji: fund.emoji,
      startDate: toDate(fund.startDate),
      endDate: toDate(fund.endDate),
    },
  });

  const startDate = watch("startDate");

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    onOpenChange?.(value);
  };

  const onSubmit = (data: UpdateFundFormValues) => {
    const startDate = data.startDate
      ? data.startDate.toISOString().split("T")[0]
      : null;
    const endDate = data.endDate
      ? data.endDate.toISOString().split("T")[0]
      : null;

    mutate({
      name: "updateFund",
      mutation: updateFundMutation,
      variables: {
        id: fund.id,
        name: data.name,
        emoji: data.emoji,
        startDate,
        endDate,
      },
      rollbackData: { ...fund },
      events: [
        {
          type: "updateFund",
          payload: {
            id: fund.id,
            name: data.name,
            emoji: data.emoji,
            startDate,
            endDate,
          },
        },
      ],
    });

    reset({
      name: data.name,
      emoji: data.emoji,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    });
    handleOpenChange(false);
  };

  const handleDelete = () => {
    mutate({
      name: "deleteFund",
      mutation: deleteFundMutation,
      variables: { id: fund.id },
      rollbackData: { ...fund },
      events: [
        {
          type: "deleteFund",
          payload: { id: fund.id },
        },
      ],
    });
  };

  return (
    <Dialog
      open={externalOpen !== undefined ? externalOpen : open}
      onOpenChange={handleOpenChange}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Fund settings</DialogTitle>
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
                      placeholder="Fund name"
                      className={errors.name ? "border-destructive" : ""}
                      disabled={fund.isDefault}
                      autoFocus={!fund.isDefault}
                    />
                  )}
                />
                {fund.isDefault ? (
                  <p className="text-xs text-muted-foreground">
                    The default fund&apos;s name can&apos;t be changed.
                  </p>
                ) : (
                  <FieldError errors={[errors.name]} />
                )}
              </FieldContent>
            </Field>
          </div>

          <div className="flex gap-4">
            <Field className="flex-1">
              <FieldLabel>Start date</FieldLabel>
              <FieldContent>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? undefined}
                      onChange={(date) => {
                        field.onChange(date ?? null);
                        if (!date) setValue("endDate", null);
                      }}
                      className="w-full"
                    />
                  )}
                />
              </FieldContent>
            </Field>

            <Field className="flex-1">
              <FieldLabel>End date</FieldLabel>
              <FieldContent>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? undefined}
                      onChange={(date) => field.onChange(date ?? null)}
                      className="w-full"
                      disabled={!startDate}
                      fromDate={startDate ?? undefined}
                    />
                  )}
                />
                <FieldError errors={[errors.endDate]} />
              </FieldContent>
            </Field>
          </div>

          <DialogFooter>
            {!fund.isDefault && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete fund</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this fund? Money will move
                      back to the default fund. This action cannot be undone.
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
            )}
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
