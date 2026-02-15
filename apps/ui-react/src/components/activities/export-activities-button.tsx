import { verifyActivityFilter, type Activity } from "@maille/core/activities";
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
  viewId: string;
  activities: Activity[];
  className?: string;
}

export function ExportActivitiesButton({
  viewId,
  activities,
  className,
}: ExportActivitiesButtonProps) {
  const activityView = useViews((state) => state.getActivityView(viewId));

  const filteredActivities = React.useMemo(() => {
    return activities.filter((activity) => {
      if (activityView.filters.length === 0) return true;

      return activityView.filters
        .map((filter) => {
          return verifyActivityFilter(filter, activity);
        })
        .every((f) => f);
    });
  }, [activities, activityView.filters]);

  const exportActivities = () => {
    const csvFile = stringify([
      ["number", "date", "name", "amount"],
      ...filteredActivities.map((a) => [
        a.number,
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
