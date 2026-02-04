import { ActivityType, type Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal } from "lucide-react";

// Activity type colors mapping
const ACTIVITY_TYPES_COLOR = {
  [ActivityType.EXPENSE]: "red",
  [ActivityType.REVENUE]: "green",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "slate",
};

interface ActivityLineProps {
  activity: Activity;
  onClick?: (activityId: string) => void;
  selected?: boolean;
}

export function ActivityLine({ activity, onClick, selected = false }: ActivityLineProps) {
  const currencyFormatter = getCurrencyFormatter();

  const handleClick = () => {
    if (onClick) {
      onClick(activity.id);
    }
  };

  return (
    <div
      className={`hover:bg-primary-800 flex cursor-pointer items-center border-b px-4 py-3 ${selected ? "bg-primary-800" : ""}`}
      onClick={handleClick}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <Checkbox checked={selected} className="mr-3" />
        <div className="mr-4 flex items-center">
          <div
            className={`bg- mr-2 h-3 w-3 rounded-full${ACTIVITY_TYPES_COLOR[activity.type]}-500`}
          />
          <span className="text-primary-100 text-sm font-medium">{activity.number}</span>
        </div>

        <div className="mr-4 min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{activity.name}</div>
          <div className="text-primary-400 truncate text-xs">
            {activity.date.toLocaleDateString()}
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono font-semibold text-white">
            {currencyFormatter.format(activity.amount)}
          </div>
          <div
            className={`mt-1 rounded px-2 py-0.5 text-xs capitalize ${
              activity.status === "scheduled"
                ? "bg-primary-700 text-primary-100"
                : activity.status === "incomplete"
                  ? "text-primary-800 bg-orange-300"
                  : "text-primary-800 bg-emerald-300"
            }`}
          >
            {activity.status}
          </div>
        </div>

        <Button variant="ghost" size="icon" className="ml-2">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

