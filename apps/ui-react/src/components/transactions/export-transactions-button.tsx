import type { TransactionFilter } from "@maille/core/views";

import { verifyTransactionFilter } from "@maille/core/views";
import { stringify } from "csv-stringify/browser/esm/sync";
import { Download } from "lucide-react";
import * as React from "react";

import {
  buildTransactionRows,
  type TransactionViewFilter,
} from "@/components/transactions/transaction-view";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGraphQLDate } from "@/lib/date";
import { useAccounts } from "@/stores/accounts";
import { useActivities } from "@/stores/activities";
import { useFunds } from "@/stores/funds";
import { useViews } from "@/stores/views";

interface ExportTransactionsButtonProps {
  filter: TransactionViewFilter;
  /** The store-backed view whose filters to export; ignored when filters is provided. */
  viewId?: string;
  /** The view's filters, when exporting a custom view. */
  filters?: TransactionFilter[];
  className?: string;
}

export function ExportTransactionsButton({
  filter,
  viewId,
  filters,
  className,
}: ExportTransactionsButtonProps) {
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);
  const storeView = useViews((state) =>
    viewId === undefined ? undefined : state.getTransactionView(viewId),
  );

  const exportFilters = filters ?? storeView?.filters ?? [];

  const filteredRows = React.useMemo(() => {
    const rows = buildTransactionRows(activities, filter, accounts, funds);
    if (exportFilters.length === 0) return rows;
    return rows.filter((row) =>
      exportFilters
        .map((rowFilter) =>
          verifyTransactionFilter(rowFilter, {
            date: row.date,
            amount: row.amount,
            direction: row.direction,
            status: row.activity.status,
          }),
        )
        .every((matched) => matched),
    );
  }, [activities, filter, accounts, funds, exportFilters]);

  const exportTransactions = () => {
    const csvFile = stringify([
      ["id", "date", "activity", "direction", "amount"],
      ...filteredRows.map((row) => [
        row.id,
        getGraphQLDate(row.date),
        row.activity.name,
        row.direction,
        row.amount,
      ]),
    ]);

    const url = window.URL.createObjectURL(new Blob([csvFile]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          onClick={exportTransactions}
        >
          <Download className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Export transactions</p>
      </TooltipContent>
    </Tooltip>
  );
}
