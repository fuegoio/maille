import { useState, useMemo } from "react";
import { usePeriodsStore } from "@/stores/periods";
import { useActivitiesStore } from "@/stores/activities";
import { getCurrencyFormatter } from "@/utils/currency";
import type { ActivityCategory, ActivitySubCategory } from "@maille/core/activities";
import type { UUID } from "crypto";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PeriodActivityCategoryLineProps {
  periodDate: Date;
  category: ActivityCategory;
}

export function PeriodActivityCategoryLine({
  periodDate,
  category,
}: PeriodActivityCategoryLineProps) {
  const { activities, subcategories } = useActivitiesStore();
  const { viewFilters, periodsActivityData } = usePeriodsStore();
  const [expanded, setExpanded] = useState(false);

  const periodActivityCategoryValue = useMemo<number>(() => {
    return (
      periodsActivityData
        .find((p) => p.month === periodDate.getMonth() && p.year === periodDate.getFullYear())
        ?.categories.find((c) => c.category === category.id)?.value ?? 0
    );
  }, [periodsActivityData, periodDate, category.id]);

  const categorySubcategories = useMemo(() => {
    return subcategories.filter((sc) => sc.category === category.id);
  }, [subcategories, category.id]);

  const subcategoriesValues = useMemo(() => {
    const values: Record<UUID, number> = {};
    categorySubcategories.forEach((subcategory) => {
      values[subcategory.id] = 0;
    });

    activities
      .filter(
        (activity) =>
          activity.date.getMonth() === periodDate.getMonth() &&
          activity.date.getFullYear() === periodDate.getFullYear() &&
          activity.category === category.id &&
          activity.subcategory !== null,
      )
      .forEach((activity) => {
        if (values[activity.subcategory!] !== undefined) {
          values[activity.subcategory!] += activity.amount;
        }
      });

    return values;
  }, [activities, periodDate, category.id, categorySubcategories]);

  const selectCategoryToFilterActivities = () => {
    viewFilters.subcategory = null;
    viewFilters.activityType = null;
    if (viewFilters.category !== category.id) {
      viewFilters.category = category.id;
    } else {
      viewFilters.category = null;
    }
  };

  const selectSubcategoryToFilterActivities = (subcategory: ActivitySubCategory) => {
    viewFilters.category = null;
    viewFilters.activityType = null;
    if (viewFilters.subcategory !== subcategory.id) {
      viewFilters.subcategory = subcategory.id;
    } else {
      viewFilters.subcategory = null;
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`group flex h-9 cursor-pointer items-center justify-between rounded px-3 transition-colors ${
          viewFilters.category === category.id ? "bg-primary-800" : "hover:bg-primary-800"
        }`}
        onClick={selectCategoryToFilterActivities}
      >
        <div
          className={`flex items-center text-xs font-medium text-white ${
            categorySubcategories.length === 0 ? "pl-6" : ""
          }`}
        >
          {categorySubcategories.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 h-4 w-4"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {category.name}
        </div>

        <div className="flex items-center">
          <div
            className={`text-primary-200 mr-4 text-sm ${
              viewFilters.category === category.id ? "" : "hidden group-hover:block"
            }`}
          >
            {viewFilters.category === category.id ? "Clear filter" : "Filter"}
          </div>

          <div className="font-mono text-sm whitespace-nowrap text-white">
            {getCurrencyFormatter().format(periodActivityCategoryValue)}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mb-2 space-y-1">
          {categorySubcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className={`group ml-4 flex h-9 cursor-pointer items-center justify-between rounded pr-3 pl-5 ${
                viewFilters.subcategory === subcategory.id
                  ? "bg-primary-800"
                  : "hover:bg-primary-950"
              }`}
              onClick={() => selectSubcategoryToFilterActivities(subcategory)}
            >
              <div className="text-primary-700 flex items-center text-xs font-medium">
                {subcategory.name}
              </div>

              <div className="flex items-center">
                <div
                  className={`text-primary-300 mr-4 text-sm ${
                    viewFilters.subcategory === subcategory.id ? "" : "hidden group-hover:block"
                  }`}
                >
                  {viewFilters.subcategory === subcategory.id ? "Clear filter" : "Filter"}
                </div>

                <div className="text-primary-300 text-sm whitespace-nowrap">
                  {getCurrencyFormatter().format(subcategoriesValues[subcategory.id])}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
