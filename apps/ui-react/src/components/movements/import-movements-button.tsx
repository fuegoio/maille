import type { Movement } from "@maille/core/movements";

import { zodResolver } from "@hookform/resolvers/zod";
import { parse, format, isSameDay } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropZone } from "@/components/upload-drop-zone";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { parseRecords, type DelimiterOption } from "@/lib/csv";
import { getGraphQLDate } from "@/lib/date";
import { extractMovementsFromText } from "@/lib/extract-movements";
import { movementCreateHistoryEvent } from "@/lib/history-events";
import { cn } from "@/lib/utils";
import { createMovementMutation } from "@/mutations/movements";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

import { Separator } from "../ui/separator";

type ImportMode = "csv" | "paste";
type EditableField = "name" | "date" | "amount";

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
  edited: boolean;
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
  const [mode, setMode] = React.useState<ImportMode>("csv");
  const [step, setStep] = React.useState(0);
  const [rawText, setRawText] = React.useState("");
  const [delimiter, setDelimiter] = React.useState<DelimiterOption>("auto");
  const [records, setRecords] = React.useState<Record<string, string>[]>([]);
  const [previewRows, setPreviewRows] = React.useState<PreviewRow[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [importMovementIds, setImportMovementIds] = React.useState<string[]>(
    [],
  );
  const [pastedText, setPastedText] = React.useState("");
  const [pasteAccount, setPasteAccount] = React.useState("");
  const [pasteRatio, setPasteRatio] = React.useState(100);
  const [extracting, setExtracting] = React.useState(false);
  const [extractionError, setExtractionError] = React.useState<string | null>(
    null,
  );
  const [extractionNotice, setExtractionNotice] = React.useState<string | null>(
    null,
  );
  const [droppedCount, setDroppedCount] = React.useState(0);
  const [previewAccount, setPreviewAccount] = React.useState("");
  const [editing, setEditing] = React.useState<{
    index: number;
    field: EditableField;
  } | null>(null);
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

  const { control, handleSubmit, reset } = form;

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
        Math.abs(m.amount - amount) <= 0.05 &&
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
        edited: false,
      };
    });
  };

  const goToPreview = (data: FormValues) => {
    setPreviewRows(buildPreviewRows(data));
    setPreviewAccount(data.account);
    setDroppedCount(0);
    setStep(2);
  };

  const handleExtract = async () => {
    if (pastedText.trim().length === 0) {
      setExtractionNotice(null);
      setExtractionError("Paste a statement, an email or an HTML page first.");
      return;
    }
    if (!pasteAccount) {
      setExtractionNotice(null);
      setExtractionError("Select the account the movements belong to.");
      return;
    }

    setExtracting(true);
    setExtractionError(null);
    setExtractionNotice(null);
    try {
      const result = await extractMovementsFromText(pastedText);
      if (result.movements.length === 0) {
        setExtractionNotice("No movements found in this text.");
        return;
      }

      const rows: PreviewRow[] = result.movements.map((movement, index) => {
        const date = parse(movement.date, "yyyy-MM-dd", new Date());
        const amount = movement.amount * (pasteRatio / 100);
        const dup = checkDuplicate(
          pasteAccount,
          movement.name,
          date,
          amount,
          movements,
        );
        return {
          index,
          name: movement.name,
          date,
          amount,
          isDuplicate: dup,
          skip: dup,
          edited: false,
        };
      });

      setPreviewRows(rows);
      setPreviewAccount(pasteAccount);
      setDroppedCount(result.dropped);
      setStep(2);
    } catch (error) {
      setExtractionError(
        error instanceof Error
          ? error.message
          : "The extraction failed. Try again.",
      );
    } finally {
      setExtracting(false);
    }
  };

  const toggleRow = (index: number) => {
    setPreviewRows((rows) =>
      rows.map((r) => (r.index === index ? { ...r, skip: !r.skip } : r)),
    );
  };

  const commitEdit = (index: number, field: EditableField, raw: string) => {
    setEditing(null);
    setPreviewRows((rows) =>
      rows.map((r) => {
        if (r.index !== index) return r;

        // Edits re-derive the duplicate flag, and with it the skip state —
        // same semantics as when the preview was first built.
        const withDuplicate = (partial: Partial<PreviewRow>): PreviewRow => ({
          ...r,
          ...partial,
          edited: true,
        });

        if (field === "name") {
          const name = raw.trim();
          if (!name || name === r.name) return r;
          const isDuplicate = checkDuplicate(
            previewAccount,
            name,
            r.date,
            r.amount,
            movements,
          );
          return withDuplicate({ name, isDuplicate, skip: isDuplicate });
        }

        if (field === "date") {
          const date = parseDate(raw);
          if (isNaN(date.getTime()) || +date === +r.date) return r;
          const isDuplicate = checkDuplicate(
            previewAccount,
            r.name,
            date,
            r.amount,
            movements,
          );
          return withDuplicate({ date, isDuplicate, skip: isDuplicate });
        }

        const amount = parseFloat(raw.replace(/ /g, "").replace(/,/g, "."));
        if (isNaN(amount) || amount === r.amount) return r;
        const isDuplicate = checkDuplicate(
          previewAccount,
          r.name,
          r.date,
          amount,
          movements,
        );
        return withDuplicate({ amount, isDuplicate, skip: isDuplicate });
      }),
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

  const toImport = previewRows.filter((r) => !r.skip);

  // Derive imported count from the movements store — each movement appears
  // in the store via optimistic update when its mutation is fired
  const movementIds = React.useMemo(
    () => new Set(movements.map((m) => m.id)),
    [movements],
  );

  const importedCount = importMovementIds.filter((id) =>
    movementIds.has(id),
  ).length;
  const allImported =
    importMovementIds.length > 0 && importedCount === importMovementIds.length;

  const processImport = () => {
    const account = previewAccount;
    const ids: string[] = [];

    toImport.forEach((row) => {
      const movement = {
        id: crypto.randomUUID(),
        name: row.name,
        date: getGraphQLDate(row.date),
        account,
        amount: row.amount,
      };
      ids.push(movement.id);

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

    setImportMovementIds(ids);
    setImporting(true);
  };

  // Fire onImported callback once all movements have landed in the store
  React.useEffect(() => {
    if (!importing || !allImported) return;
    if (onImported) onImported();
  }, [importing, allImported]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetDialog = () => {
    setDialogOpen(false);
    setMode("csv");
    setStep(0);
    setRawText("");
    setDelimiter("auto");
    setRecords([]);
    setPreviewRows([]);
    setImporting(false);
    setImportMovementIds([]);
    setPastedText("");
    setPasteAccount("");
    setPasteRatio(100);
    setExtracting(false);
    setExtractionError(null);
    setExtractionNotice(null);
    setDroppedCount(0);
    setPreviewAccount("");
    setEditing(null);
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

  const stepLabels =
    mode === "csv"
      ? ["Upload", "Map fields", "Preview & import"]
      : ["Paste", "Preview & import"];
  const stepLabelIndex = mode === "csv" ? step : step === 2 ? 1 : 0;

  const goBackFromPreview = () => {
    if (mode === "csv") {
      setStep(1);
    } else {
      setPreviewRows([]);
      setEditing(null);
      setStep(0);
    }
  };

  const editorKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: EditableField,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit(index, field, event.currentTarget.value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditing(null);
    }
  };

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
          if (!open && (!importing || allImported)) resetDialog();
          else if (open) setDialogOpen(true);
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[85vh] flex-col sm:max-w-2xl",
            step === 2 && "sm:max-w-3xl",
          )}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>Import movements</DialogTitle>
          </DialogHeader>

          <div className="flex shrink-0 items-center gap-1.5 border-b px-1 pb-4 text-xs text-muted-foreground">
            {stepLabels.map((label, i) => {
              const isActive = stepLabelIndex === i;
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
            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as ImportMode);
                setExtractionError(null);
                setExtractionNotice(null);
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="shrink-0 self-start">
                <TabsTrigger value="csv">CSV file</TabsTrigger>
                <TabsTrigger value="paste">Paste text</TabsTrigger>
              </TabsList>

              <TabsContent
                value="csv"
                className="mt-0 min-h-0 flex-1 overflow-y-auto pt-3 pb-4"
              >
                <UploadDropZone onFile={handleInputFile} />
              </TabsContent>

              <TabsContent
                value="paste"
                className="mt-0 flex min-h-0 flex-1 flex-col pt-3"
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  <Textarea
                    value={pastedText}
                    onChange={(event) => {
                      setPastedText(event.target.value);
                      setExtractionError(null);
                      setExtractionNotice(null);
                    }}
                    placeholder="Paste a bank statement, an email, a receipt, or an HTML page — the AI extracts every movement it contains."
                    className="min-h-44 flex-1 resize-none font-mono text-xs"
                    disabled={extracting}
                  />
                  {extractionError && (
                    <p className="pt-2 text-sm text-destructive">
                      {extractionError}
                    </p>
                  )}
                  {extractionNotice && (
                    <p className="pt-2 text-sm text-muted-foreground">
                      {extractionNotice}
                    </p>
                  )}

                  <div className="flex items-start gap-4 pt-4 pb-4">
                    <Field className="min-w-0 flex-1">
                      <FieldLabel htmlFor="paste-account">Account</FieldLabel>
                      <AccountSelect
                        id="paste-account"
                        value={pasteAccount}
                        onChange={(value) => setPasteAccount(value ?? "")}
                        movementsOnly
                      />
                    </Field>

                    <Field className="w-32 shrink-0">
                      <FieldLabel htmlFor="paste-ratio">Ratio</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="paste-ratio"
                          type="number"
                          step="0.01"
                          min="0"
                          value={pasteRatio}
                          onChange={(event) =>
                            setPasteRatio(parseFloat(event.target.value) || 0)
                          }
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>%</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>
                        Use 50 for a shared account (50%).
                      </FieldDescription>
                    </Field>
                  </div>
                </div>

                <DialogFooter className="shrink-0 border-t pt-4">
                  <Button variant="outline" type="button" onClick={resetDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="ml-2"
                    onClick={handleExtract}
                    disabled={extracting}
                  >
                    {extracting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Sparkles />
                    )}
                    {extracting ? "Extracting..." : "Extract movements"}
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          ) : step === 1 ? (
            <form
              onSubmit={handleSubmit(goToPreview)}
              className="flex min-h-0 min-w-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto pb-4">
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
                {droppedCount > 0 && (
                  <span className="text-muted-foreground">
                    · {droppedCount} could not be read
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  Click a cell to correct it
                </span>
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
                          disabled={importing}
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
                    {(() => {
                      let importIdx = 0;
                      return previewRows.map((row) => {
                        const isImportingRow = !row.skip;
                        const rowImportIdx = isImportingRow ? importIdx++ : -1;
                        const rowMovementId =
                          rowImportIdx >= 0
                            ? importMovementIds[rowImportIdx]
                            : undefined;
                        const rowDone =
                          importing &&
                          rowMovementId &&
                          movementIds.has(rowMovementId);
                        const rowPending =
                          importing && isImportingRow && !rowDone;

                        const editingField =
                          editing?.index === row.index ? editing.field : null;

                        const cellButton =
                          "w-full rounded-sm px-1.5 py-1 text-left transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed";

                        return (
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
                                disabled={importing}
                                onCheckedChange={() => toggleRow(row.index)}
                              />
                            </td>
                            <td className="h-10 max-w-[200px] px-1 text-sm">
                              {editingField === "name" ? (
                                <Input
                                  autoFocus
                                  defaultValue={row.name}
                                  className="h-7 px-1.5 text-sm"
                                  onFocus={(event) => event.target.select()}
                                  onBlur={(event) =>
                                    commitEdit(
                                      row.index,
                                      "name",
                                      event.target.value,
                                    )
                                  }
                                  onKeyDown={(event) =>
                                    editorKeyDown(event, row.index, "name")
                                  }
                                />
                              ) : (
                                <button
                                  type="button"
                                  className={cn(cellButton, "truncate")}
                                  disabled={importing}
                                  onClick={() =>
                                    setEditing({
                                      index: row.index,
                                      field: "name",
                                    })
                                  }
                                >
                                  <span className="block truncate">
                                    {row.name}
                                  </span>
                                </button>
                              )}
                            </td>
                            <td className="h-10 px-1 text-sm">
                              {editingField === "date" ? (
                                <Input
                                  autoFocus
                                  defaultValue={format(row.date, "dd/MM/yyyy")}
                                  className="h-7 px-1.5 text-sm"
                                  onFocus={(event) => event.target.select()}
                                  onBlur={(event) =>
                                    commitEdit(
                                      row.index,
                                      "date",
                                      event.target.value,
                                    )
                                  }
                                  onKeyDown={(event) =>
                                    editorKeyDown(event, row.index, "date")
                                  }
                                />
                              ) : (
                                <button
                                  type="button"
                                  className={cn(
                                    cellButton,
                                    "whitespace-nowrap text-muted-foreground",
                                  )}
                                  disabled={importing}
                                  onClick={() =>
                                    setEditing({
                                      index: row.index,
                                      field: "date",
                                    })
                                  }
                                >
                                  {format(row.date, "dd MMM yyyy")}
                                </button>
                              )}
                            </td>
                            <td className="h-10 px-1 text-sm">
                              {editingField === "amount" ? (
                                <Input
                                  autoFocus
                                  defaultValue={String(row.amount)}
                                  inputMode="decimal"
                                  className="h-7 px-1.5 text-right font-mono text-sm"
                                  onFocus={(event) => event.target.select()}
                                  onBlur={(event) =>
                                    commitEdit(
                                      row.index,
                                      "amount",
                                      event.target.value,
                                    )
                                  }
                                  onKeyDown={(event) =>
                                    editorKeyDown(event, row.index, "amount")
                                  }
                                />
                              ) : (
                                <button
                                  type="button"
                                  className={cn(
                                    cellButton,
                                    "text-right font-mono whitespace-nowrap",
                                  )}
                                  disabled={importing}
                                  onClick={() =>
                                    setEditing({
                                      index: row.index,
                                      field: "amount",
                                    })
                                  }
                                >
                                  {currencyFormatter.format(row.amount)}
                                </button>
                              )}
                            </td>
                            <td className="h-10 px-3 text-right">
                              {rowDone ? (
                                <span className="inline-flex items-center gap-1 text-xs text-foreground">
                                  <Check className="size-3" />
                                  Imported
                                </span>
                              ) : rowPending ? (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Loader2 className="size-3 animate-spin" />
                                  Importing
                                </span>
                              ) : row.isDuplicate ? (
                                <span className="text-xs text-muted-foreground">
                                  Duplicate
                                </span>
                              ) : row.edited ? (
                                <span className="text-xs text-muted-foreground">
                                  Edited
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              <DialogFooter className="shrink-0 border-t pt-4">
                {allImported ? (
                  <Button type="button" variant="outline" onClick={resetDialog}>
                    Close
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={importing}
                      onClick={goBackFromPreview}
                    >
                      <ArrowLeft />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="ml-2"
                      disabled={importCount === 0 || importing}
                      onClick={processImport}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Importing {importedCount}/{toImport.length}
                        </>
                      ) : (
                        <>
                          Import {importCount}{" "}
                          {importCount === 1 ? "movement" : "movements"}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
