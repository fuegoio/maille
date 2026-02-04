import * as React from "react";
import { useStore } from "zustand";
import { movementsStore } from "@/stores/movements";
import { eventsStore } from "@/stores/events";
import { createMovementMutation } from "@/mutations/movements";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UploadDropZone } from "@/components/upload-drop-zone";
import { AccountSelect } from "@/components/accounts/account-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UUID } from "crypto";
import { parse } from "csv-parse/browser/esm/sync";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

interface ImportMovementsButtonProps {
  large?: boolean;
  className?: string;
  onImported?: () => void;
}

export function ImportMovementsButton({ 
  large = false, 
  className, 
  onImported 
}: ImportMovementsButtonProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [records, setRecords] = React.useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = React.useState({
    date: undefined as string | undefined,
    amount: undefined as string | undefined,
    name: undefined as string | undefined,
  });
  const [account, setAccount] = React.useState<UUID | undefined>(undefined);

  const movements = useStore(movementsStore, (state) => state.movements);

  const headers = React.useMemo(() => {
    if (records.length === 0) return [];
    return Object.keys(records[0]);
  }, [records]);

  const handleInputFile = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
      const data = event.target!.result as string;
      const parsedRecords = parse(data, {
        delimiter: [";", ","],
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      });

      setRecords(parsedRecords);
      if (parsedRecords.length !== 0) {
        setStep(1);
      }
    });
    reader.readAsText(file);
  };

  const processFile = () => {
    if (!account || !mapping.name || !mapping.date || !mapping.amount) return;

    records.forEach((record) => {
      const movementName = record[mapping.name!];
      const movementDate = dayjs(
        record[mapping.date!],
        ["DD/MM/YYYY", "D/M/YYYY", "YYYY-MM-DD"]
      ).toDate();
      const movementAmount = parseFloat(
        record[mapping.amount!]
          .replace(/ /g, "")
          .replace(/,/g, ".")
      );

      const existingMovement = movements.find(
        (m) =>
          m.account === account &&
          m.date.getTime() === movementDate.getTime() &&
          m.amount === movementAmount &&
          m.name.toLowerCase() === movementName.toLowerCase()
      );

      if (!existingMovement) {
        const movement = movementsStore.getState().addMovement({
          date: movementDate,
          amount: movementAmount,
          account: account,
          name: movementName,
          activities: [],
        });

        eventsStore.getState().sendEvent({
          name: "createMovement",
          mutation: createMovementMutation,
          variables: {
            id: movement.id,
            name: movement.name,
            date: movement.date.toISOString().split('T')[0],
            account: movement.account,
            amount: movement.amount,
          },
          rollbackData: undefined,
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
    setMapping({
      date: undefined,
      amount: undefined,
      name: undefined,
    });
    setAccount(undefined);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={large ? "default" : "sm"}
        className={className}
        onClick={() => setDialogOpen(true)}
      >
        <Upload className={`h-4 w-4 ${large ? "mr-2" : "mr-1"}`} />
        <span>{large ? "Import movements" : "Import"}</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import movements from a CSV</DialogTitle>
          </DialogHeader>

          {step === 0 ? (
            <div className="py-4">
              <UploadDropZone onFile={handleInputFile} />
            </div>
          ) : (
            <div className="w-full">
              <div className="py-4 px-0 flex flex-col sm:flex-row sm:items-center gap-4 border-b">
                <label className="text-sm text-primary-100 w-32">Account</label>
                <div className="flex-1">
                  <AccountSelect
                    modelValue={account}
                    onUpdateModelValue={setAccount}
                    movementsOnly
                  />
                </div>
              </div>

              <div className="py-2 border-b">
                <div className="py-2 px-0 flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="text-sm text-primary-100 w-32">Name field</label>
                  <div className="flex-1">
                    <Select
                      value={mapping.name}
                      onValueChange={(value) => setMapping((prev) => ({ ...prev, name: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select name field" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="py-2 px-0 flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="text-sm text-primary-100 w-32">Amount field</label>
                  <div className="flex-1">
                    <Select
                      value={mapping.amount}
                      onValueChange={(value) => setMapping((prev) => ({ ...prev, amount: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select amount field" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="py-2 px-0 flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="text-sm text-primary-100 w-32">Date field</label>
                  <div className="flex-1">
                    <Select
                      value={mapping.date}
                      onValueChange={(value) => setMapping((prev) => ({ ...prev, date: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select date field" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="text-sm text-primary-100 px-0 mt-4 mb-2">
                CSV data
              </div>
              <div className="w-full overflow-auto max-h-44 py-4 px-0">
                <table className="border-collapse w-full">
                  <thead>
                    <tr>
                      {headers.map((header) => (
                        <th key={header} className="border border-white h-10 px-6 text-white text-sm">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index}>
                        {headers.map((header) => (
                          <td key={header} className="border border-white h-10 px-6 text-primary-100 text-sm whitespace-nowrap">
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
                <Button onClick={processFile} className="ml-2">
                  Import movements
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}