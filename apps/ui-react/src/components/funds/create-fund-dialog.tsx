import { zodResolver } from "@hookform/resolvers/zod";
import { DEFAULT_FUND_COLOR, type Fund } from "@maille/core/funds";
import { type ReactNode, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

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
import { createFundMutation, updateFundMutation } from "@/mutations/funds";
import { useSync } from "@/stores/sync";

import { FundSelect } from "./fund-select";

const createFundSchema = z
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

type CreateFundFormValues = z.infer<typeof createFundSchema>;

interface CreateFundDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  onCreate?: (fundId: string) => void;
  /** Preselected parent, when the dialog opens from a "new subfund" action. */
  defaultParent?: string;
}

export function CreateFundDialog({
  open: externalOpen,
  onOpenChange,
  children,
  onCreate,
  defaultParent,
}: CreateFundDialogProps) {
  const mutate = useSync((state) => state.mutate);
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateFundFormValues>({
    resolver: zodResolver(createFundSchema),
    defaultValues: {
      name: "",
      color: DEFAULT_FUND_COLOR,
      parentFund: defaultParent ?? null,
      startDate: null,
      endDate: null,
    },
  });

  const startDate = watch("startDate");

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) reset();
    onOpenChange?.(value);
  };

  const onSubmit = (data: CreateFundFormValues) => {
    const id = crypto.randomUUID();
    const startDate = data.startDate
      ? data.startDate.toISOString().split("T")[0]
      : null;
    const endDate = data.endDate
      ? data.endDate.toISOString().split("T")[0]
      : null;

    mutate({
      name: "createFund",
      mutation: createFundMutation,
      variables: {
        id,
        name: data.name,
        color: data.color,
        parentFund: data.parentFund,
      },
      rollbackData: undefined,
      events: [
        {
          type: "createFund",
          payload: {
            id,
            name: data.name,
            color: data.color,
            startDate,
            endDate,
            parentFund: data.parentFund,
          },
        },
      ],
    });

    if (startDate || endDate) {
      const rollbackFund: Fund = {
        id,
        name: data.name,
        color: data.color,
        startDate: null,
        endDate: null,
        parentFund: data.parentFund,
      };
      mutate({
        name: "updateFund",
        mutation: updateFundMutation,
        variables: { id, startDate, endDate },
        rollbackData: rollbackFund,
        events: [
          {
            type: "updateFund",
            payload: { id, startDate, endDate },
          },
        ],
      });
    }

    onCreate?.(id);
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
          <DialogTitle>New fund</DialogTitle>
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
                      onChange={(date) => field.onChange(date ?? null)}
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
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create fund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
