import { createFileRoute, notFound } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useState } from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddAndEditProjectModal } from "@/components/projects/add-and-edit-project-modal";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  component: ProjectPage,
  loader: async ({ params }) => {
    const projects = useProjects.getState().projects;
    const project = projects.find((p) => p.id === params.id);
    if (!project) {
      throw notFound();
    }

    return { project };
  },
});

function ProjectPage() {
  const projectId = Route.useParams().id;
  const project = useProjects((state) => state.getProjectById(projectId));
  if (!project) {
    throw notFound();
  }

  const activities = useActivities((state) => state.activities);
  const projectActivities = activities.filter((a) => a.project === projectId);

  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <div className="flex items-center gap-2 truncate font-medium">
          {project.emoji && <span className="text-xl">{project.emoji}</span>}
          <span>{project.name}</span>
          {project.startDate || project.endDate ? (
            <span className="ml-2 text-sm text-muted-foreground">
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
            </span>
          ) : null}
        </div>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEditModal(true)}
        >
          <Settings className="mr-2 h-4 w-4" />
          Edit
        </Button>

        <AddAndEditProjectModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          projectId={project.id}
        />
      </header>

      <div className="flex flex-1 flex-col">
        <div className="p-4">
          <h3 className="text-sm font-medium">Activities</h3>
          <p className="text-sm text-muted-foreground">
            {projectActivities.length} activities linked to this project
          </p>
        </div>

        <div className="border-t">
          <ActivitiesTable
            viewId="project-detail"
            activities={projectActivities}
            hideProject={true}
          />
        </div>
      </div>
    </SidebarInset>
  );
}

