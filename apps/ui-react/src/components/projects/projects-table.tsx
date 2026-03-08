import { ActivityType } from "@maille/core/activities";
import { useNavigate } from "@tanstack/react-router";
import { TentTree } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";
import { getActivityTypeTotalForProject } from "@/logic/activities";
import { useActivities, ACTIVITY_TYPES_COLOR } from "@/stores/activities";
import { useProjects } from "@/stores/projects";

import { CreateProjectDialog } from "./create-project-dialog";

export function ProjectsTable() {
  const projects = useProjects((state) => state.projects);
  const activities = useActivities((state) => state.activities);
  const navigate = useNavigate();
  const currencyFormatter = useCurrencyFormatter();

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [projects]);

  return (
    <div className="flex h-full flex-col">
      {sortedProjects.map((project) => (
        <div
          key={project.id}
          className="group flex h-12 w-full items-center border-b pr-6 pl-6 hover:bg-muted/50"
          onClick={() => {
            navigate({
              to: `/projects/$id`,
              params: { id: project.id },
            });
          }}
        >
          <div className="flex items-center gap-2">
            {project.emoji && <span className="text-xl">{project.emoji}</span>}
            <div className="text-sm font-medium">{project.name}</div>
          </div>

          {project.startDate || project.endDate ? (
            <div className="ml-4 text-sm text-muted-foreground">
              {project.startDate ? (
                <span>
                  {project.startDate instanceof Date
                    ? project.startDate.toLocaleDateString()
                    : new Date(project.startDate).toLocaleDateString()}
                </span>
              ) : null}
              {project.startDate && project.endDate ? <span> - </span> : null}
              {project.endDate ? (
                <span>
                  {project.endDate instanceof Date
                    ? project.endDate.toLocaleDateString()
                    : new Date(project.endDate).toLocaleDateString()}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex-1" />

          {/* Activities count */}
          <div className="mr-4 flex w-32 items-center justify-end text-right font-mono text-sm text-muted-foreground">
            {activities.filter((a) => a.project === project.id).length}{" "}
            activities
          </div>

          {/* Revenue */}
          <div className="mr-4 flex w-32 items-center pl-4 text-right font-mono text-sm">
            <div
              className={cn(
                "mr-3 size-2.5 shrink-0 rounded-lg",
                ACTIVITY_TYPES_COLOR[ActivityType.REVENUE],
              )}
            />
            <div className="flex-1">
              {currencyFormatter.format(
                getActivityTypeTotalForProject({
                  projectId: project.id,
                  activityType: ActivityType.REVENUE,
                  activities,
                }),
              )}
            </div>
          </div>

          {/* Investment */}
          <div className="mr-4 flex w-32 items-center pl-4 text-right font-mono text-sm">
            <div
              className={cn(
                "mr-3 size-2.5 shrink-0 rounded-lg",
                ACTIVITY_TYPES_COLOR[ActivityType.INVESTMENT],
              )}
            />
            <div className="flex-1">
              {currencyFormatter.format(
                getActivityTypeTotalForProject({
                  projectId: project.id,
                  activityType: ActivityType.INVESTMENT,
                  activities,
                }),
              )}
            </div>
          </div>

          {/* Expense */}
          <div className="mr-4 flex w-32 items-center pl-4 text-right font-mono text-sm">
            <div
              className={cn(
                "mr-3 size-2.5 shrink-0 rounded-lg",
                ACTIVITY_TYPES_COLOR[ActivityType.EXPENSE],
              )}
            />
            <div className="flex-1">
              {currencyFormatter.format(
                getActivityTypeTotalForProject({
                  projectId: project.id,
                  activityType: ActivityType.EXPENSE,
                  activities,
                }),
              )}
            </div>
          </div>

          {/* Neutral */}
          <div className="flex w-32 items-center pl-4 text-right font-mono text-sm">
            <div
              className={cn(
                "mr-3 size-2.5 shrink-0 rounded-lg",
                ACTIVITY_TYPES_COLOR[ActivityType.NEUTRAL],
              )}
            />
            <div className="flex-1">
              {currencyFormatter.format(
                getActivityTypeTotalForProject({
                  projectId: project.id,
                  activityType: ActivityType.NEUTRAL,
                  activities,
                }),
              )}
            </div>
          </div>
        </div>
      ))}

      {projects.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TentTree />
              </EmptyMedia>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t created any projects yet. Get started by
                creating your first project.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <CreateProjectDialog>
                <Button>Create project</Button>
              </CreateProjectDialog>
            </EmptyContent>
          </Empty>
        </div>
      )}
    </div>
  );
}
