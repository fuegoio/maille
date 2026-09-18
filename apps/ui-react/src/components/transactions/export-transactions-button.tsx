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

interface ExportTransactionsButtonProps {
  filter: TransactionViewFilter;
  /** The view's filters, when exporting a custom view. */
  filters?: TransactionFilter[];
  className?: string;
}

export function ExportTransactionsButton({
  filter,
  filters,
  className,
}: ExportTransactionsButtonProps) {
  const activities = useActivities((state) => state.activities);
  const accounts = useAccounts((state) => state.accounts);
  const funds = useFunds((state) => state.funds);

  const filteredRows = React.useMemo(() => {
    const rows = buildTransactionRows(activities, filter, accounts, funds);
    if (!filters || filters.length === 0) return rows;
    return rows.filter((row) =>
      filters
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
  }, [activities, filter, accounts, funds, filters]);

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
