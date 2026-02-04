import { useState, useMemo } from "react";
import { useStore } from "zustand";
import { projectsStore } from "@/stores/projects";
import { activitiesStore } from "@/stores/activities";
import type { ActivityCategory, ActivitySubCategory } from "@maille/core/activities";
import type { Activity } from "@maille/core/activities";
import type { UUID } from "crypto";
import { getCurrencyFormatter } from "@/utils/currency";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ProjectActivityCategoryLineProps {
  projectActivities: Activity[];
  category: ActivityCategory;
}

export function ProjectActivityCategoryLine({ 
  projectActivities, 
  category 
}: ProjectActivityCategoryLineProps) {
  const { viewFilters } = useStore(projectsStore, (state) => ({ viewFilters: state.viewFilters }));
  const { activitySubcategories } = useStore(activitiesStore, (state) => ({ activitySubcategories: state.activitySubcategories }));

  const [expanded, setExpanded] = useState(false);

  const categoryValue = useMemo(() => {
    return projectActivities
      .filter((activity) => activity.category === category.id)
      .reduce((sum, activity) => sum + activity.amount, 0);
  }, [projectActivities, category.id]);

  const categorySubcategories = useMemo(() => {
    return activitySubcategories.filter((sc) => sc.category === category.id);
  }, [activitySubcategories, category.id]);

  const subcategoriesValues = useMemo(() => {
    const values: Record<UUID, number> = {};
    
    categorySubcategories.forEach((subcategory) => {
      values[subcategory.id] = 0;
    });

    projectActivities
      .filter(
        (activity) => 
          activity.category === category.id && 
          activity.subcategory !== null,
      )
      .forEach((activity) => {
        if (values[activity.subcategory!] !== undefined) {
          values[activity.subcategory!] += activity.amount;
        }
      });

    return values;
  }, [projectActivities, category.id, categorySubcategories]);

  const selectCategoryToFilterActivities = () => {
    projectsStore.getState().viewFilters.subcategory = null;
    projectsStore.getState().viewFilters.activityType = null;
    if (projectsStore.getState().viewFilters.category !== category.id) {
      projectsStore.getState().viewFilters.category = category.id;
    } else {
      projectsStore.getState().viewFilters.category = null;
    }
  };

  const selectSubcategoryToFilterActivities = (subcategory: ActivitySubCategory) => {
    projectsStore.getState().viewFilters.category = null;
    projectsStore.getState().viewFilters.activityType = null;
    if (projectsStore.getState().viewFilters.subcategory !== subcategory.id) {
      projectsStore.getState().viewFilters.subcategory = subcategory.id;
    } else {
      projectsStore.getState().viewFilters.subcategory = null;
    }
  };

  if (categoryValue === 0) return null;

  return (
    <>
      <div
        className={`flex items-center justify-between h-9 rounded px-3 group cursor-pointer $
          ${viewFilters.category === category.id ? "bg-primary-800" : "hover:bg-primary-800"}
        `}
        onClick={selectCategoryToFilterActivities}
      >
        <div
          className={`text-xs font-medium flex items-center $
            ${categorySubcategories.length === 0 ? "pl-6" : ""}
          `}
        >
          {categorySubcategories.length > 0 && (
            <button
              className="h-4 w-4 flex items-center mr-2"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {category.name}
        </div>

        <div className="flex items-center">
          <div
            className={`mr-4 text-primary-200 text-sm $
              ${viewFilters.category === category.id ? "" : "hidden group-hover:block"}
            `}
          >
            {viewFilters.category === category.id ? "Clear filter" : "Filter"}
          </div>

          <div className="whitespace-nowrap text-white text-sm font-mono">
            {getCurrencyFormatter().format(categoryValue)}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mb-2">
          {categorySubcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className={`flex items-center h-9 rounded ml-4 pl-5 pr-3 group justify-between cursor-pointer $
                ${viewFilters.subcategory === subcategory.id ? "bg-primary-800" : "hover:bg-primary-800"}
              `}
              onClick={() => selectSubcategoryToFilterActivities(subcategory)}
            >
              <div className="text-xs font-medium flex items-center">
                {subcategory.name}
              </div>

              <div className="flex items-center">
                <div
                  className={`mr-4 text-primary-200 text-sm $
                    ${viewFilters.subcategory === subcategory.id ? "" : "hidden group-hover:block"}
                  `}
                >
                  {viewFilters.subcategory === subcategory.id ? "Clear filter" : "Filter"}
                </div>

                <div className="whitespace-nowrap text-white text-sm font-mono">
                  {getCurrencyFormatter().format(subcategoriesValues[subcategory.id])}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}