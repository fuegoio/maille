import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  SquareChartGantt,
} from "lucide-react";
import { useState } from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog";
import { ProjectSummary } from "@/components/projects/project-summary";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";
import type { ActivitiesFilters } from "@/types/activities";

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

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [activitiesFilters, setActivitiesFilters] = useState<ActivitiesFilters>(
    {},
  );

  return (
    <SidebarInset className="flex-row">
      <div className="flex flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/projects">Projects</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {project.emoji && (
                    <span className="mr-1">{project.emoji}</span>
                  )}
                  <span>{project.name}</span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
          {!summaryOpen && (
            <Button variant="default" onClick={() => setSummaryOpen(true)}>
              <SquareChartGantt />
              Summary
              <ChevronRight />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings />
            Edit
          </Button>

          <ProjectSettingsDialog
            project={project}
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
          />
        </header>

        <div className="flex flex-1 flex-col">
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
      </div>

      {summaryOpen && (
        <div className="h-full w-full max-w-md overflow-y-auto border-l bg-muted/30">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSummaryOpen(false)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="text-sm font-medium">Summary</div>
          </div>

          <ProjectSummary
            project={project}
            activitiesFilters={activitiesFilters}
            onActivitiesFiltersChange={setActivitiesFilters}
          />
        </div>
      )}
    </SidebarInset>
  );
}
