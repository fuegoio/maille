import type { Movement } from "@maille/core/movements";

import { zodResolver } from "@hookform/resolvers/zod";
import { parse as parseCSV } from "csv-parse/browser/esm/sync";
import { parse, format, isSameDay } from "date-fns";
import { ArrowLeft, ArrowRight, Upload } from "lucide-react";
import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { AccountSelect } from "@/components/accounts/account-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDropZone } from "@/components/upload-drop-zone";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { getGraphQLDate } from "@/lib/date";
import { movementCreateHistoryEvent } from "@/lib/history-events";
import { cn } from "@/lib/utils";
import { createMovementMutation } from "@/mutations/movements";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

import { Separator } from "../ui/separator";

type DelimiterOption = "auto" | "semicolon" | "comma" | "tab";

const DELIMITER_VALUES: Record<DelimiterOption, string | string[]> = {
  auto: [";", ","],
  semicolon: ";",
  comma: ",",
  tab: "\t",
};

function parseRecords(
  text: string,
  delimiter: DelimiterOption,
): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, "");
  return parseCSV(clean, {
    delimiter: DELIMITER_VALUES[delimiter],
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}

const formSchema = z.object({
  account: z.string().min(1, "Account is required"),
  mapping: z.object({
    date: z.string().min(1, "Date field is required"),
    amounts: z
      .array(z.string())
      .min(1, "At least one value column is required"),
    name: z.string().min(1, "Name field is required"),
  }),
  ratio: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

type PreviewRow = {
  index: number;
  name: string;
  date: Date;
  amount: number;
  isDuplicate: boolean;
  skip: boolean;
};

interface ImportMovementsButtonProps {
  className?: string;
  onImported?: () => void;
}

export function ImportMovementsButton({
  className,
  onImported,
}: ImportMovementsButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [rawText, setRawText] = React.useState("");
  const [delimiter, setDelimiter] = React.useState<DelimiterOption>("auto");
  const [records, setRecords] = React.useState<Record<string, string>[]>([]);
  const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([]);
  const mutate = useSync((state) => state.mutate);
  const movements = useMovements((state) => state.movements);
  const currencyFormatter = useCurrencyFormatter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account: "",
      mapping: {
        date: "",
        amounts: [],
        name: "",
      },
      ratio: 100,
    },
  });

  const { control, handleSubmit, reset, getValues } = form;

  const headers = React.useMemo(() => {
    if (records.length === 0) return [];
    return Object.keys(records[0]).filter((h) => h.trim() !== "");
  }, [records]);

  const handleInputFile = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
      const data = event.target!.result as string;
      setRawText(data);
      setDelimiter("auto");
      const parsedRecords = parseRecords(data, "auto");
      setRecords(parsedRecords);
      if (parsedRecords.length !== 0) {
        setStep(1);
      }
    });
    reader.readAsText(file);
  };

  const handleDelimiterChange = (value: DelimiterOption) => {
    setDelimiter(value);
    const parsedRecords = parseRecords(rawText, value);
    setRecords(parsedRecords);
    reset({
      account: form.getValues("account"),
      mapping: { date: "", amounts: [], name: "" },
      ratio: form.getValues("ratio"),
    });
  };

  const parseDate = (dateString: string): Date => {
    const formats = ["dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd"];
    let movementDate = new Date(dateString);

    for (const fmt of formats) {
      const parsedDate = parse(dateString, fmt, new Date());
      if (!isNaN(parsedDate.getTime())) {
        movementDate = parsedDate;
        break;
      }
    }
    return movementDate;
  };

  const parseAmount = (
    record: Record<string, string>,
    amountColumns: string[],
    ratio: number,
  ): number => {
    return (
      amountColumns.reduce((sum, column) => {
        const raw = record[column];
        if (!raw) return sum;
        const parsed = parseFloat(raw.replace(/ /g, "").replace(/,/g, "."));
        return sum + (isNaN(parsed) ? 0 : parsed);
      }, 0) *
      (ratio / 100)
    );
  };

  const checkDuplicate = (
    account: string,
    name: string,
    date: Date,
    amount: number,
    existing: Movement[],
  ): boolean => {
    return existing.some(
      (m) =>
        m.account === account &&
        isSameDay(m.date, date) &&
        m.amount === amount &&
        m.name.toLowerCase() === name.toLowerCase(),
    );
  };

  const buildPreviewRows = (data: FormValues): PreviewRow[] => {
    const { account, mapping, ratio } = data;

    return records.map((record, index) => {
      const name = record[mapping.name] ?? "";
      const date = parseDate(record[mapping.date] ?? "");
      const amount = parseAmount(record, mapping.amounts, ratio);
      const dup = checkDuplicate(account, name, date, amount, movements);

      return {
        index,
        name,
        date,
        amount,
        isDuplicate: dup,
        skip: dup,
      };
    });
  };

  const goToPreview = (data: FormValues) => {
    setPreviewRows(buildPreviewRows(data));
    setStep(2);
  };

  const toggleRow = (index: number) => {
    setPreviewRows((rows) =>
      rows.map((r) => (r.index === index ? { ...r, skip: !r.skip } : r)),
    );
  };

  const allSkipped = previewRows.length > 0 && previewRows.every((r) => r.skip);
  const noneSkipped = previewRows.every((r) => !r.skip);

  const toggleAll = () => {
    setPreviewRows((rows) => rows.map((r) => ({ ...r, skip: !allSkipped })));
  };

  const importCount = previewRows.filter((r) => !r.skip).length;
  const skipCount = previewRows.filter((r) => r.skip).length;
  const duplicateCount = previewRows.filter((r) => r.isDuplicate).length;

  const processImport = () => {
    const { account } = getValues();

    previewRows
      .filter((r) => !r.skip)
      .forEach((row) => {
        const movement = {
          id: crypto.randomUUID(),
          name: row.name,
          date: getGraphQLDate(row.date),
          account,
          amount: row.amount,
        };

        mutate({
          name: "createMovement",
          mutation: createMovementMutation,
          variables: movement,
          rollbackData: undefined,
          events: [
            {
              type: "createMovement",
              payload: movement,
            },
            movementCreateHistoryEvent(movement.id),
          ],
        });
      });

    if (onImported) onImported();
    resetDialog();
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setStep(0);
    setRawText("");
    setDelimiter("auto");
    setRecords([]);
    setPreviewRows([]);
    reset({
      account: "",
      mapping: {
        date: "",
        amounts: [],
        name: "",
      },
      ratio: 100,
    });
  };

  const stepLabels = ["Upload", "Map fields", "Preview & import"];

  return (
    <>
      <Button
        type="button"
        variant="default"
        className={className}
        onClick={() => setDialogOpen(true)}
      >
        <Upload />
        Import movements
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetDialog();
          else setDialogOpen(true);
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[85vh] flex-col sm:max-w-2xl",
            step === 2 && "sm:max-w-3xl",
          )}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>Import movements from a CSV</DialogTitle>
          </DialogHeader>

          <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            {stepLabels.map((label, i) => {
              const isActive = step === i;
              return (
                <React.Fragment key={label}>
                  {i > 0 && (
                    <ArrowRight className="size-3 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      "font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {step === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto pt-1 pb-4">
              <UploadDropZone onFile={handleInputFile} />
            </div>
          ) : step === 1 ? (
            <form
              onSubmit={handleSubmit(goToPreview)}
              className="flex min-h-0 min-w-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-1">
                <FieldGroup>
                  <Controller
                    name="account"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="account">Account</FieldLabel>
                        <AccountSelect
                          value={field.value}
                          onChange={field.onChange}
                          movementsOnly
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Separator />

                  <Field>
                    <FieldLabel htmlFor="delimiter">Separator</FieldLabel>
                    <Select
                      value={delimiter}
                      onValueChange={(value) =>
                        handleDelimiterChange(value as DelimiterOption)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select separator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="semicolon">Semicolon (;)</SelectItem>
                        <SelectItem value="comma">Comma (,)</SelectItem>
                        <SelectItem value="tab">Tab</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Separator />

                  <Controller
                    name="mapping.name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="name-field">Name field</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select name field" />
                          </SelectTrigger>
                          <SelectContent>
                            {headers.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className="flex items-start gap-4">
                    <Controller
                      name="mapping.amounts"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field
                          className="min-w-0 flex-1"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldLabel htmlFor="amount-field">
                            Value columns
                          </FieldLabel>
                          <MultiSelect
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <MultiSelectTrigger className="w-full">
                              <MultiSelectValue placeholder="Select value column(s)" />
                            </MultiSelectTrigger>
                            <MultiSelectContent className="w-fit">
                              {headers.map((header) => (
                                <MultiSelectItem key={header} value={header}>
                                  {header}
                                </MultiSelectItem>
                              ))}
                            </MultiSelectContent>
                          </MultiSelect>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="ratio"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field
                          className="w-32 shrink-0"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldLabel htmlFor="ratio">Ratio</FieldLabel>
                          <InputGroup>
                            <InputGroupInput
                              id="ratio"
                              type="number"
                              step="0.01"
                              min="0"
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>%</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                          <FieldDescription>
                            Use 50 for a shared account (50%).
                          </FieldDescription>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <Controller
                    name="mapping.date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="date-field">Date field</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select date field" />
                          </SelectTrigger>
                          <SelectContent>
                            {headers.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </div>

              <DialogFooter className="shrink-0 border-t pt-4">
                <Button variant="outline" type="button" onClick={resetDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="ml-2">
                  Preview
                  <ArrowRight />
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-3 border-b px-1 pb-3 text-sm">
                <span className="font-medium text-foreground">
                  {importCount} to import
                </span>
                {skipCount > 0 && (
                  <span className="text-muted-foreground">
                    · {skipCount} skipped
                  </span>
                )}
                {duplicateCount > 0 && (
                  <span className="text-muted-foreground">
                    · {duplicateCount} duplicate{duplicateCount > 1 ? "s" : ""}{" "}
                    detected
                  </span>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr className="border-b">
                      <th className="h-9 w-10 px-3 text-left">
                        <Checkbox
                          checked={
                            previewRows.length === 0
                              ? false
                              : allSkipped
                                ? false
                                : noneSkipped
                                  ? true
                                  : "indeterminate"
                          }
                          onCheckedChange={(checked) => {
                            if (checked !== "indeterminate") toggleAll();
                          }}
                        />
                      </th>
                      <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-9 px-2 text-left text-xs font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="h-9 px-2 text-right text-xs font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="h-9 px-3 text-right text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr
                        key={row.index}
                        className={cn(
                          "group border-b transition-colors hover:bg-muted/50",
                          row.skip && "opacity-45",
                        )}
                      >
                        <td className="h-10 px-3">
                          <Checkbox
                            checked={!row.skip}
                            onCheckedChange={() => toggleRow(row.index)}
                          />
                        </td>
                        <td className="h-10 max-w-[200px] truncate px-2 text-sm">
                          {row.name}
                        </td>
                        <td className="h-10 px-2 text-sm whitespace-nowrap text-muted-foreground">
                          {format(row.date, "dd MMM yyyy")}
                        </td>
                        <td className="h-10 px-2 text-right font-mono text-sm whitespace-nowrap">
                          {currencyFormatter.format(row.amount)}
                        </td>
                        <td className="h-10 px-3 text-right">
                          {row.isDuplicate && (
                            <span className="text-xs text-muted-foreground">
                              Duplicate
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <DialogFooter className="shrink-0 border-t pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft />
                  Back
                </Button>
                <Button
                  type="button"
                  className="ml-2"
                  disabled={importCount === 0}
                  onClick={processImport}
                >
                  Import {importCount}{" "}
                  {importCount === 1 ? "movement" : "movements"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
