import { useMemo } from "react";
import { useStore } from "zustand";
import { projectsStore } from "@/stores/projects";
import { activitiesStore } from "@/stores/activities";
import { ActivityType } from "@maille/core/activities";
import type { Activity } from "@maille/core/activities";
import { getCurrencyFormatter } from "@/utils/currency";
import { ProjectActivityCategoryLine } from "./project-activity-category-line";

// Color mapping for activity types
const ACTIVITY_TYPES_COLOR: Record<ActivityType, string> = {
  [ActivityType.REVENUE]: "green",
  [ActivityType.EXPENSE]: "red",
  [ActivityType.INVESTMENT]: "orange",
  [ActivityType.NEUTRAL]: "gray",
};

const ACTIVITY_TYPES_NAME: Record<ActivityType, string> = {
  [ActivityType.REVENUE]: "Revenue",
  [ActivityType.EXPENSE]: "Expense",
  [ActivityType.INVESTMENT]: "Investment",
  [ActivityType.NEUTRAL]: "Neutral",
};

interface ProjectActivitiesSummaryProps {
  projectActivities: Activity[];
}

export function ProjectActivitiesSummary({ projectActivities }: ProjectActivitiesSummaryProps) {
  const { viewFilters } = useStore(projectsStore, (state) => ({ viewFilters: state.viewFilters }));
  const { activityCategories } = useStore(activitiesStore, (state) => ({ activityCategories: state.activityCategories }));

  const activitiesTotal = useMemo(() => {
    const totals: Partial<Record<ActivityType, number>> = {};

    projectActivities.forEach((a) => {
      if (totals[a.type] === undefined) {
        totals[a.type] = a.amount;
      } else {
        totals[a.type]! += a.amount;
      }
    });

    return totals;
  }, [projectActivities]);

  const selectActivityTypeToFilterActivities = (activityType: ActivityType) => {
    projectsStore.getState().viewFilters.category = null;
    projectsStore.getState().viewFilters.subcategory = null;
    if (projectsStore.getState().viewFilters.activityType !== activityType) {
      projectsStore.getState().viewFilters.activityType = activityType;
    } else {
      projectsStore.getState().viewFilters.activityType = null;
    }
  };

  const activityTypesToShow = [
    ActivityType.REVENUE,
    ActivityType.EXPENSE,
    ActivityType.INVESTMENT,
  ];

  return (
    <>
      {activityTypesToShow.map((activityType) => (
        <div key={activityType} className="border-b py-3 px-3 w-full">
          <div
            className={`flex items-center justify-between px-3 rounded group h-9 cursor-pointer $
              ${viewFilters.activityType === activityType ? "bg-primary-800" : "hover:bg-primary-800"}
              ${activitiesTotal[activityType] !== undefined ? "mb-3" : ""}
            `}
            onClick={() => selectActivityTypeToFilterActivities(activityType)}
          >
            <div className="flex items-center">
              <div
                className={`size-3 rounded shrink-0 mr-3 bg-${ACTIVITY_TYPES_COLOR[activityType]}-300`}
              />
              <span
                className={`text-sm font-medium $
                  ${activitiesTotal[activityType] !== undefined ? "text-white" : "text-primary-600"}
                `}
              >
                {ACTIVITY_TYPES_NAME[activityType]}
              </span>
            </div>

            <div className="flex items-center">
              <div
                className={`mr-4 text-primary-200 text-sm $
                  ${viewFilters.activityType === activityType ? "" : "hidden group-hover:block"}
                `}
              >
                {viewFilters.activityType === activityType ? "Clear filter" : "Filter"}
              </div>

              <div
                className={`whitespace-nowrap text-right text-sm font-medium font-mono $
                  ${activitiesTotal[activityType] !== undefined ? "text-white" : "text-primary-600"}
                `}
              >
                {getCurrencyFormatter().format(activitiesTotal[activityType] ?? 0)}
              </div>
            </div>
          </div>

          {activityCategories
            .filter((c) => c.type === activityType)
            .map((category) => (
              <ProjectActivityCategoryLine
                key={category.id}
                projectActivities={projectActivities}
                category={category}
              />
            ))}
        </div>
      ))}
    </>
  );
}