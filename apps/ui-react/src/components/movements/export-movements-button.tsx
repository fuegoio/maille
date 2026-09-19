import type { Movement, MovementFilter } from "@maille/core/movements";

import { verifyMovementFilter } from "@maille/core/movements";
import { stringify } from "csv-stringify/browser/esm/sync";
import { Download } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getGraphQLDate } from "@/lib/date";
import { useAccounts } from "@/stores/accounts";
import { useViews } from "@/stores/views";

interface ExportMovementsButtonProps {
  movements: Movement[];
  /** The store-backed view whose filters to export; ignored when filters is provided. */
  viewId?: string;
  /** The view's filters, when exporting a custom view. */
  filters?: MovementFilter[];
  className?: string;
}

export function ExportMovementsButton({
  movements,
  viewId,
  filters,
  className,
}: ExportMovementsButtonProps) {
  const accounts = useAccounts((state) => state.accounts);
  const storeView = useViews((state) =>
    viewId === undefined ? undefined : state.getMovementView(viewId),
  );

  const exportFilters = React.useMemo(
    () => filters ?? storeView?.filters ?? [],
    [filters, storeView],
  );

  const filteredMovements = React.useMemo(() => {
    return movements.filter((movement) => {
      if (exportFilters.length === 0) return true;

      return exportFilters
        .map((filter) => verifyMovementFilter(filter, movement))
        .every((matched) => matched);
    });
  }, [movements, exportFilters]);

  const exportMovements = () => {
    const csvFile = stringify([
      ["id", "date", "name", "amount", "account"],
      ...filteredMovements.map((movement) => [
        movement.id,
        getGraphQLDate(movement.date),
        movement.name,
        movement.amount,
        accounts.find((account) => account.id === movement.account)?.name ?? "",
      ]),
    ]);

    const url = window.URL.createObjectURL(new Blob([csvFile]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "movements_export.csv");
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
          onClick={exportMovements}
        >
          <Download className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Export movements</p>
      </TooltipContent>
    </Tooltip>
  );
}
