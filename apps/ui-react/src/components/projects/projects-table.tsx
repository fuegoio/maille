import { useNavigate } from "@tanstack/react-router";
import { TentTree } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";

import { AddAndEditProjectModal } from "./add-and-edit-project-modal";

export function ProjectsTable() {
  const projects = useProjects((state) => state.projects);
  const activities = useActivities((state) => state.activities);
  const navigate = useNavigate();

  const getActivitiesLinkedToProject = (projectId: string) => {
    return activities.filter((a) => a.project === projectId).length;
  };

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

          <div className="flex-1" />

          <Badge className="ml-4" variant="outline">
            {getActivitiesLinkedToProject(project.id)} activities
          </Badge>

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
              <AddAndEditProjectModal />
            </EmptyContent>
          </Empty>
        </div>
      )}
    </div>
  );
}
