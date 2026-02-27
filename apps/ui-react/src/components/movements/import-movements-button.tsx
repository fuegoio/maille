import { zodResolver } from "@hookform/resolvers/zod";
import { parse as parseCSV } from "csv-parse/browser/esm/sync";
import { parse } from "date-fns";
import { Upload } from "lucide-react";
import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { AccountSelect } from "@/components/accounts/account-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDropZone } from "@/components/upload-drop-zone";
import { getGraphQLDate } from "@/lib/date";
import { createMovementMutation } from "@/mutations/movements";
import { useMovements } from "@/stores/movements";
import { useSync } from "@/stores/sync";

import { Separator } from "../ui/separator";

// Form schema using zod
const formSchema = z.object({
  account: z.string().min(1, "Account is required"),
  mapping: z.object({
    date: z.string().min(1, "Date field is required"),
    amount: z.string().min(1, "Amount field is required"),
    name: z.string().min(1, "Name field is required"),
  }),
});

type FormValues = z.infer<typeof formSchema>;

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
  const [records, setRecords] = React.useState<Record<string, string>[]>([]);
  const mutate = useSync((state) => state.mutate);
  const movements = useMovements((state) => state.movements);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account: "",
      mapping: {
        date: "",
        amount: "",
        name: "",
      },
    },
  });

  const { control, handleSubmit, reset } = form;

  const headers = React.useMemo(() => {
    if (records.length === 0) return [];
    return Object.keys(records[0]);
  }, [records]);

  const handleInputFile = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
      const data = event.target!.result as string;
      const parsedRecords = parseCSV(data, {
        delimiter: [";", ","],
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      });

      setRecords(parsedRecords as Record<string, string>[]);
      if (parsedRecords.length !== 0) {
        setStep(1);
      }
    });
    reader.readAsText(file);
  };

  const processFile = (data: FormValues) => {
    const { account, mapping } = data;

    records.forEach((record) => {
      const movementName = record[mapping.name];

      const dateString = record[mapping.date];
      const formats = ["dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd"];
      let movementDate = new Date(dateString);

      for (const format of formats) {
        const parsedDate = parse(dateString, format, new Date());
        if (!isNaN(parsedDate.getTime())) {
          movementDate = parsedDate;
          break;
        }
      }
      const movementAmount = parseFloat(
        record[mapping.amount].replace(/ /g, "").replace(/,/g, "."),
      );

      const existingMovement = movements.find(
        (m) =>
          m.account === account &&
          m.date.getTime() === movementDate.getTime() &&
          m.amount === movementAmount &&
          m.name.toLowerCase() === movementName.toLowerCase(),
      );

      if (!existingMovement) {
        const movement = {
          id: crypto.randomUUID(),
          name: movementName,
          date: getGraphQLDate(movementDate),
          account,
          amount: movementAmount,
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
          ],
        });
      }
    });

    if (onImported) onImported();
    resetDialog();
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setStep(0);
    setRecords([]);
    reset({
      account: "",
      mapping: {
        date: "",
        amount: "",
        name: "",
      },
    });
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Import movements from a CSV</DialogTitle>
          </DialogHeader>

          {step === 0 ? (
            <div className="pt-1 pb-4">
              <UploadDropZone onFile={handleInputFile} />
            </div>
          ) : (
            <form onSubmit={handleSubmit(processFile)} className="min-w-0">
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
                  name="mapping.amount"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="amount-field">
                        Amount field
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select amount field" />
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
              </FieldGroup>

              <Separator className="mt-4" />
              <div className="mt-4 mb-2 px-0 text-sm">CSV data</div>
              <div className="max-h-44 w-full max-w-full overflow-auto px-0 py-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header}
                          className="h-10 border border-white px-6 text-sm text-white"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index}>
                        {headers.map((header) => (
                          <td
                            key={header}
                            className="text-primary-100 h-10 border border-white px-6 text-sm whitespace-nowrap"
                          >
                            {record[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <DialogFooter className="border-t pt-4">
                <Button variant="outline" onClick={resetDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="ml-2">
                  Import movements
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
