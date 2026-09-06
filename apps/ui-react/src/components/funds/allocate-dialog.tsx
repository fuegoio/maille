import type { ReactNode } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { AmountInput } from "@/components/ui/amount-input";
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
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { createFundMoveMutation } from "@/mutations/funds";
import { useFunds } from "@/stores/funds";
import { useSync } from "@/stores/sync";

import { FundSelect } from "./fund-select";

const allocateSchema = z.object({
  fromFund: z.string().min(1, "A source fund is required"),
  toFund: z.string().min(1, "A destination fund is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.date(),
});

type AllocateFormValues = z.infer<typeof allocateSchema>;

interface AllocateDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  defaultToFund?: string;
}

export function AllocateDialog({
  open: externalOpen,
  onOpenChange,
  children,
  defaultToFund,
}: AllocateDialogProps) {
  const mutate = useSync((state) => state.mutate);
  const funds = useFunds((state) => state.funds);
  const defaultFund = funds.find((f) => f.isDefault);
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AllocateFormValues>({
    resolver: zodResolver(allocateSchema),
    defaultValues: {
      fromFund: defaultFund?.id ?? "",
      toFund: defaultToFund ?? "",
      amount: 0,
      date: new Date(),
    },
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset();
    onOpenChange?.(value);
  };

  const onSubmit = (data: AllocateFormValues) => {
    if (data.fromFund === data.toFund) return;

    const id = crypto.randomUUID();
    const date = data.date.toISOString();

    mutate({
      name: "createFundMove",
      mutation: createFundMoveMutation,
      variables: {
        id,
        fromFund: data.fromFund,
        toFund: data.toFund,
        amount: data.amount,
        date: data.date.toISOString().split("T")[0],
      },
      rollbackData: undefined,
      events: [
        {
          type: "createFundMove",
          payload: {
            id,
            fromFund: data.fromFund,
            toFund: data.toFund,
            amount: data.amount,
            date,
            note: null,
            transaction: null,
          },
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
          <DialogTitle>Allocate money</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-2">
            <Field className="flex-1">
              <FieldLabel>From</FieldLabel>
              <FieldContent>
                <Controller
                  name="fromFund"
                  control={control}
                  render={({ field }) => (
                    <FundSelect
                      value={field.value || null}
                      onValueChange={field.onChange}
                      placeholder="Source fund"
                    />
                  )}
                />
                <FieldError errors={[errors.fromFund]} />
              </FieldContent>
            </Field>

            <ArrowRight className="mt-6 size-4 text-muted-foreground" />

            <Field className="flex-1">
              <FieldLabel>To</FieldLabel>
              <FieldContent>
                <Controller
                  name="toFund"
                  control={control}
                  render={({ field }) => (
                    <FundSelect
                      value={field.value || null}
                      onValueChange={field.onChange}
                      placeholder="Destination fund"
                    />
                  )}
                />
                <FieldError errors={[errors.toFund]} />
              </FieldContent>
            </Field>
          </div>

          <div className="flex gap-4">
            <Field>
              <FieldLabel>Amount</FieldLabel>
              <FieldContent>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <AmountInput
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? 0)}
                      mode="field"
                    />
                  )}
                />
                <FieldError errors={[errors.amount]} />
              </FieldContent>
            </Field>

            <Field className="flex-1">
              <FieldLabel>Date</FieldLabel>
              <FieldContent>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? undefined}
                      onChange={(date) => field.onChange(date ?? new Date())}
                      className="w-full"
                    />
                  )}
                />
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
              {isSubmitting ? "Allocating..." : "Allocate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
