import type { Project } from "@maille/core/projects";

import { ActivityType } from "@maille/core/activities";
import { format } from "date-fns";
import { ArrowRight, CalendarIcon } from "lucide-react";
import { useMemo } from "react";

import type { ActivitiesFilters } from "@/types/activities";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useActivities } from "@/stores/activities";

import { ProjectActivitiesSummary } from "./project-activities-summary";

interface ProjectSummaryProps {
  project: Project;
  activitiesFilters: ActivitiesFilters;
  onActivitiesFiltersChange(filters: ActivitiesFilters): void;
}

export function ProjectSummary({
  project,
  activitiesFilters,
  onActivitiesFiltersChange,
}: ProjectSummaryProps) {
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = useCurrencyFormatter();

  const projectActivities = useMemo(
    () => activities.filter((a) => a.project === project.id),
    [activities, project.id],
  );

  const total = useMemo(
    () =>
      projectActivities.reduce((sum, a) => {
        if (a.type === ActivityType.EXPENSE) {
          return sum - a.amount;
        } else if (a.type === ActivityType.REVENUE) {
          return sum + a.amount;
        }
        return sum;
      }, 0),
    [projectActivities],
  );

  const toDate = (value: Date | string | null | undefined): Date | null => {
    if (!value) return null;
    return value instanceof Date ? value : new Date(value);
  };

  const startDate = toDate(project.startDate);
  const endDate = toDate(project.endDate);

  return (
    <>
      <div className="w-full border-b p-6">
        <div className="mb-3 flex items-center gap-2">
          {project.emoji && <span className="text-2xl">{project.emoji}</span>}
          <h2 className="text-base font-semibold">{project.name}</h2>
        </div>

        {(startDate || endDate) && (
          <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarIcon className="size-3.5 shrink-0" />
            {startDate && <span>{format(startDate, "MMM d, yyyy")}</span>}
            {startDate && endDate && (
              <ArrowRight className="size-3.5 shrink-0" />
            )}
            {endDate && <span>{format(endDate, "MMM d, yyyy")}</span>}
          </div>
        )}

        <div className="mt-4 flex items-center text-sm">
          <span className="text-muted-foreground">
            {projectActivities.length}{" "}
            {projectActivities.length === 1 ? "activity" : "activities"}
          </span>
          <div className="flex-1" />
          <span className="font-mono font-medium">
            {currencyFormatter.format(total)}
          </span>
        </div>
      </div>

      <ProjectActivitiesSummary
        projectId={project.id}
        activitiesFilters={activitiesFilters}
        onActivitiesFiltersChange={onActivitiesFiltersChange}
      />
    </>
  );
}
