import type { Fund } from "@maille/core/funds";

import { zodResolver } from "@hookform/resolvers/zod";
import { getFundDescendants } from "@maille/core/funds";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
import {
  deleteFundMutation,
  setFundAllocationsMutation,
  updateFundMutation,
} from "@/mutations/funds";
import { useFunds } from "@/stores/funds";
import { useSync } from "@/stores/sync";

import {
  allocationRowsFromFundAllocations,
  FundAllocationsEditor,
  significantAllocationRows,
  type AllocationRow,
} from "./fund-allocations-editor";
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
  const fundAllocations = useFunds((state) => state.fundAllocations);
  const [open, setOpen] = useState(false);
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>(() =>
    allocationRowsFromFundAllocations(
      fundAllocations.filter((allocation) => allocation.fund === fund.id),
    ),
  );
  const [allocationError, setAllocationError] = useState<string | null>(null);

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

  const fundFormValues = (target: Fund): UpdateFundFormValues => ({
    name: target.name,
    color: target.color,
    parentFund: target.parentFund ?? null,
    startDate: toDate(target.startDate),
    endDate: toDate(target.endDate),
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateFundFormValues>({
    resolver: zodResolver(updateFundSchema),
    defaultValues: fundFormValues(fund),
  });

  // The dialog stays mounted while the user navigates between funds via the
  // breadcrumb: resync the form when the focused fund actually changes. The
  // fund object identity changes on every store update, so guard on the id
  // to keep user edits while the dialog is open.
  const lastFundId = useRef(fund.id);
  useEffect(() => {
    if (lastFundId.current === fund.id) return;
    lastFundId.current = fund.id;
    reset(fundFormValues(fund));
    setAllocationRows(
      allocationRowsFromFundAllocations(
        useFunds
          .getState()
          .fundAllocations.filter((allocation) => allocation.fund === fund.id),
      ),
    );
  }, [fund, reset]);

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

    // Replace the fund's whole opening position when it changed: the server
    // replays the ledger and rejects over-claiming.
    const currentAllocations = useFunds
      .getState()
      .fundAllocations.filter((allocation) => allocation.fund === fund.id);
    const nextAllocations = significantAllocationRows(allocationRows);
    const byAccount = (rows: { account: string; amount: number }[]) =>
      JSON.stringify(
        [...rows].sort((a, b) => a.account.localeCompare(b.account)),
      );
    if (
      byAccount(nextAllocations) !==
      byAccount(
        currentAllocations.map((allocation) => ({
          account: allocation.account,
          amount: allocation.amount,
        })),
      )
    ) {
      mutate({
        name: "setFundAllocations",
        mutation: setFundAllocationsMutation,
        variables: { fund: fund.id, allocations: nextAllocations },
        rollbackData: currentAllocations,
        events: [
          {
            type: "updateFundAllocations",
            payload: {
              fund: fund.id,
              allocations: nextAllocations.map((allocation) => ({
                id: allocation.id,
                account: allocation.account,
                amount: allocation.amount,
              })),
            },
          },
        ],
      });
    }

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

          <FundAllocationsEditor
            startDate={startDate ?? null}
            rows={allocationRows}
            onChange={setAllocationRows}
            excludeFund={fund.id}
            onErrorChange={setAllocationError}
          />

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
            <Button
              type="submit"
              disabled={isSubmitting || allocationError !== null}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
