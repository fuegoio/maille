import * as React from "react";
import { useViews } from "@/stores/views";
import { verifyLiabilityFilter } from "@maille/core/liabilities";
import { stringify } from "csv-stringify/browser/esm/sync";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ExportLiabilitiesButtonProps {
  viewId: string;
  liabilities: any[]; // Replace with proper Liability type
  className?: string;
}

export function ExportLiabilitiesButton({
  viewId,
  liabilities,
  className,
}: ExportLiabilitiesButtonProps) {
  const liabilityView = useViews((state) => state.getLiabilityView(viewId));

  const filteredLiabilities = React.useMemo(() => {
    return liabilities.filter((liability) => {
      if (liabilityView.filters.length === 0) return true;

      return liabilityView.filters
        .map((filter) => {
          return verifyLiabilityFilter(filter, liability);
        })
        .every((f) => f);
    });
  }, [liabilities, liabilityView.filters]);

  const exportLiabilities = () => {
    const csvFile = stringify([
      ["id", "date", "name", "amount", "account"],
      ...filteredLiabilities.map((l) => [
        l.id,
        l.date.toISOString().split("T")[0], // Format date as YYYY-MM-DD
        l.name,
        l.amount,
        l.account,
      ]),
    ]);

    const url = window.URL.createObjectURL(new Blob([csvFile]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `liabilities_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" className={className} onClick={exportLiabilities}>
          <Download className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Export liabilities</p>
      </TooltipContent>
    </Tooltip>
  );
}
