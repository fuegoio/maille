import {
  verifyActivityFilter,
  type Activity,
  type ActivityFilter,
} from "@maille/core/activities";
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
import { useViews } from "@/stores/views";

interface ExportActivitiesButtonProps {
  /** The store-backed view to export; ignored when filters is provided. */
  viewId?: string;
  activities: Activity[];
  /** The view's filters, when exporting a custom view. */
  filters?: ActivityFilter[];
  className?: string;
}

export function ExportActivitiesButton({
  viewId,
  activities,
  filters,
  className,
}: ExportActivitiesButtonProps) {
  const activityView = useViews((state) =>
    viewId === undefined ? undefined : state.getActivityView(viewId),
  );
  const viewFilters = React.useMemo(
    () => filters ?? activityView?.filters ?? [],
    [filters, activityView],
  );

  const filteredActivities = React.useMemo(() => {
    return activities.filter((activity) => {
      if (viewFilters.length === 0) return true;

      return viewFilters
        .map((filter) => {
          return verifyActivityFilter(filter, activity);
        })
        .every((f) => f);
    });
  }, [activities, viewFilters]);

  const exportActivities = () => {
    const csvFile = stringify([
      ["id", "date", "name", "amount"],
      ...filteredActivities.map((a) => [
        a.id,
        getGraphQLDate(a.date),
        a.name,
        a.amount,
      ]),
    ]);

    const url = window.URL.createObjectURL(new Blob([csvFile]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `activities_export.csv`);
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
          onClick={exportActivities}
        >
          <Download className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Export activities</p>
      </TooltipContent>
    </Tooltip>
  );
}
