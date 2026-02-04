import * as React from "react";
import { useStore } from "zustand";
import { viewsStore } from "@/stores/views";
import { ActivityType, type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

// Activity type colors mapping
const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "red",
  [ActivityType.REVENUE]: "green",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "slate",
};

interface ActivitiesTableProps {
  viewId: string;
  activities: Activity[];
}

export function ActivitiesTable({ viewId, activities }: ActivitiesTableProps) {
  const activityView = useStore(viewsStore, (state) => state.getActivityView(viewId));
  const currencyFormatter = getCurrencyFormatter();

  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof Activity;
    direction: "ascending" | "descending";
  } | null>(null);

  const sortedActivities = React.useMemo(() => {
    if (!sortConfig) return activities;

    return [...activities].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "ascending" ? 1 : -1;
      if (bValue == null) return sortConfig.direction === "ascending" ? -1 : 1;

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }, [activities, sortConfig]);

  const requestSort = (key: keyof Activity) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (activityId: string) => {
    if (activityView) {
      activityView.focusedActivity = activityId;
    }
  };

  const getSortIndicator = (key: keyof Activity) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            <TableHead className="w-[100px]">
              <button
                onClick={() => requestSort("number")}
                className="flex items-center"
              >
                Number {getSortIndicator("number")}
              </button>
            </TableHead>
            <TableHead className="w-[150px]">
              <button
                onClick={() => requestSort("date")}
                className="flex items-center"
              >
                Date {getSortIndicator("date")}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => requestSort("name")}
                className="flex items-center"
              >
                Name {getSortIndicator("name")}
              </button>
            </TableHead>
            <TableHead className="w-[120px]">
              <button
                onClick={() => requestSort("type")}
                className="flex items-center"
              >
                Type {getSortIndicator("type")}
              </button>
            </TableHead>
            <TableHead className="w-[150px] text-right">
              <button
                onClick={() => requestSort("amount")}
                className="flex items-center justify-end"
              >
                Amount {getSortIndicator("amount")}
              </button>
            </TableHead>
            <TableHead className="w-[100px]">
              <button
                onClick={() => requestSort("status")}
                className="flex items-center"
              >
                Status {getSortIndicator("status")}
              </button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedActivities.map((activity) => (
            <TableRow
              key={activity.id}
              onClick={() => handleRowClick(activity.id)}
              className="cursor-pointer hover:bg-primary-800"
            >
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>{activity.number}</TableCell>
              <TableCell>
                {activity.date.toLocaleDateString()}
              </TableCell>
              <TableCell>{activity.name}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div
                    className={`h-3 w-3 rounded-full mr-2 bg-${ACTIVITY_TYPES_COLOR[activity.type]}-500`}
                  />
                  <span className="capitalize">
                    {activity.type}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {currencyFormatter.format(activity.amount)}
              </TableCell>
              <TableCell>
                <div
                  className={`capitalize px-2 py-1 rounded text-xs ${
                    activity.status === "scheduled"
                      ? "bg-primary-700 text-primary-100"
                      : activity.status === "incomplete"
                      ? "bg-orange-300 text-primary-800"
                      : "bg-emerald-300 text-primary-800"
                  }`}
                >
                  {activity.status}
                </div>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}