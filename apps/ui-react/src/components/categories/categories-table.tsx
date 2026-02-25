import { ActivityType } from "@maille/core/activities";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import {
  useActivities,
  ACTIVITY_TYPES_COLOR,
  ACTIVITY_TYPES_NAME,
} from "@/stores/activities";

import { Badge } from "../ui/badge";

export function CategoriesTable() {
  const activityCategories = useActivities((state) => state.activityCategories);
  const activities = useActivities((state) => state.activities);
  const navigate = useNavigate();
  const currencyFormatter = useCurrencyFormatter();

  const [groupsFolded, setGroupsFolded] = useState<ActivityType[]>([]);

  const sortedCategories = useMemo(() => {
    return [...activityCategories].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [activityCategories]);

  const getNumberOfActivities = (categoryId: string) => {
    return activities.filter((a) => a.category === categoryId).length;
  };

  const getTotalOfCategory = (categoryId: string) => {
    return activities
      .filter((a) => a.category === categoryId)
      .reduce((acc, a) => {
        return acc + a.amount;
      }, 0);
  };

  return [
    ActivityType.EXPENSE,
    ActivityType.REVENUE,
    ActivityType.INVESTMENT,
    ActivityType.NEUTRAL,
  ].map((activityType) => (
    <div key={activityType}>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 px-6">
        <ChevronDown
          className={cn(
            "mr-3 size-3 opacity-20 transition-all hover:opacity-100",
            groupsFolded.includes(activityType) && "-rotate-90 opacity-100",
          )}
          onClick={() => {
            if (groupsFolded.includes(activityType)) {
              setGroupsFolded((prev) =>
                prev.filter((id) => id !== activityType),
              );
            } else {
              setGroupsFolded((prev) => [...prev, activityType]);
            }
          }}
        />

        <div
          className={cn(
            "mr-2 h-3 w-3 shrink-0 rounded-xl",
            ACTIVITY_TYPES_COLOR[activityType],
          )}
        />
        <div className="text-sm font-medium">
          {ACTIVITY_TYPES_NAME[activityType]}
        </div>
        <div className="flex-1" />

        <div className="pl-4 text-right text-sm text-muted-foreground">
          {sortedCategories.filter((c) => c.type === activityType).length}{" "}
          categorie
          {sortedCategories.filter((c) => c.type === activityType).length > 1
            ? "s"
            : ""}
        </div>
      </div>

      {!groupsFolded.includes(activityType) &&
        sortedCategories
          .filter((category) => category.type === activityType)
          .map((category) => (
            <div
              key={category.id}
              className="group flex h-10 w-full items-center border-b pr-6 pl-14 hover:bg-muted/50"
              onClick={() => {
                navigate({
                  to: `/categories/$id`,
                  params: { id: category.id },
                });
              }}
            >
              <div className="text-sm font-medium">{category.name}</div>

              <Badge className="ml-4" variant="outline">
                {getNumberOfActivities(category.id)} activities
              </Badge>

              <div className="flex-1" />

              <div className="font-mono text-sm">
                {currencyFormatter.format(getTotalOfCategory(category.id))}
              </div>
            </div>
          ))}
    </div>
  ));
}

