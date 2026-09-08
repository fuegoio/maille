import type { Fund } from "@maille/core/funds";

import { zodResolver } from "@hookform/resolvers/zod";
import { getFundDescendants } from "@maille/core/funds";
import { type ReactNode, useMemo, useState } from "react";
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
import { ColorPicker } from "@/components/ui/color-picker";
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
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteFundMutation, updateFundMutation } from "@/mutations/funds";
import { useFunds } from "@/stores/funds";
import { useSync } from "@/stores/sync";

import { FundSelect } from "./fund-select";

const updateFundSchema = z
  .object({
    name: z.string().min(1, "Fund name is required"),
    color: z.string(),
    parentFund: z.string().nullable(),
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
  const funds = useFunds((state) => state.funds);
  const [open, setOpen] = useState(false);

  // The fund cannot become its own descendant's child: exclude itself and
  // its whole subtree from the parent picker.
  const excludedFromParent = useMemo(
    () => [fund.id, ...getFundDescendants(fund.id, funds)],
    [fund.id, funds],
  );

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
      color: fund.color,
      parentFund: fund.parentFund ?? null,
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
        color: data.color,
        parentFund: data.parentFund,
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
            color: data.color,
            startDate,
            endDate,
            parentFund: data.parentFund,
          },
        },
      ],
    });

    reset({
      name: data.name,
      color: data.color,
      parentFund: data.parentFund,
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
    handleOpenChange(false);
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
              name="color"
              control={control}
              render={({ field }) => (
                <ColorPicker value={field.value} onChange={field.onChange} />
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
                      autoFocus
                    />
                  )}
                />
                <FieldError errors={[errors.name]} />
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel>Parent</FieldLabel>
            <FieldContent>
              <Controller
                name="parentFund"
                control={control}
                render={({ field }) => (
                  <FundSelect
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                    placeholder="No parent"
                    allowEmpty
                    emptyLabel="No parent"
                    excludeIds={excludedFromParent}
                  />
                )}
              />
            </FieldContent>
          </Field>

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
                    Are you sure you want to delete this fund? Money allocated
                    to it moves back to Untracked and its subfunds move up one
                    level. This action cannot be undone.
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
