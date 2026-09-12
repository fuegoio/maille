import type { Project } from "@maille/core/projects";

import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChevronRight, Settings, SquareChartGantt } from "lucide-react";
import { useState } from "react";

import type { ActivitiesFilters } from "@/types/activities";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog";
import { ProjectSummary } from "@/components/projects/project-summary";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SummaryPanel } from "@/components/ui/summary-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  component: ProjectPageRoute,
  loader: async ({ params }) => {
    const projects = useProjects.getState().projects;
    const project = projects.find((p) => p.id === params.id);
    if (!project) {
      throw notFound();
    }

    return { project };
  },
});

function ProjectPageRoute() {
  const projectId = Route.useParams().id;
  const project = useProjects((state) => state.getProjectById(projectId));
  if (!project) {
    return <DeletedRedirect target={{ to: "/projects" }} />;
  }

  return <ProjectPage project={project} />;
}

function ProjectPage({ project }: { project: Project }) {
  const projectId = project.id;
  const activities = useActivities((state) => state.activities);
  const projectActivities = activities.filter((a) => a.project === projectId);

  const isMobile = useIsMobile();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);
  const [activitiesFilters, setActivitiesFilters] = useState<ActivitiesFilters>(
    {},
  );

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/projects/$id",
    entries: [
      { key: "projects", label: "Projects", target: { to: "/projects" } },
      {
        key: `project:${projectId}`,
        label: (
          <>
            {project.emoji && <span className="mr-1">{project.emoji}</span>}
            <span>{project.name}</span>
          </>
        ),
        title: project.name,
        target: { to: "/projects/$id", params: { id: projectId } },
      },
    ],
  });

  return (
    <SidebarInset className="flex-row">
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          summaryOpen && "hidden md:flex",
        )}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />
          <PageBreadcrumbs entries={breadcrumbs} />
          <div className="flex-1" />
          <AddActivityButton project={projectId} />
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings />
            Edit
          </Button>

          {!summaryOpen && (
            <Button variant="default" onClick={() => setSummaryOpen(true)}>
              <SquareChartGantt />
              Summary
              <ChevronRight />
            </Button>
          )}

          <ProjectSettingsDialog
            project={project}
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
          />
        </header>

        <ActivitiesTable
          viewId="project-detail"
          grouping="period"
          activities={projectActivities}
          hideProject={true}
          activityTypeFilter={activitiesFilters.activityType}
          categoryFilter={activitiesFilters.category}
          subcategoryFilter={activitiesFilters.subcategory}
        />
      </div>

      <SummaryPanel open={summaryOpen} onClose={() => setSummaryOpen(false)}>
        <ProjectSummary
          project={project}
          activitiesFilters={activitiesFilters}
          onActivitiesFiltersChange={setActivitiesFilters}
        />
      </SummaryPanel>
    </SidebarInset>
  );
}
