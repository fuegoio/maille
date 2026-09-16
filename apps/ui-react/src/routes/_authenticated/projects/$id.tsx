import type { Project } from "@maille/core/projects";

import { createFileRoute, notFound } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useMemo, useState } from "react";

import type { ActivitiesFilters } from "@/types/activities";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { ActivitiesAnalytics } from "@/components/analytics/activities-analytics";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog";
import { ProjectSummary } from "@/components/projects/project-summary";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { Button } from "@/components/ui/button";
import {
  SIDE_PANEL_ICONS,
  SIDE_PANEL_LABELS,
  SidePanelToggles,
} from "@/components/ui/panel-toggles";
import { SidePanel } from "@/components/ui/side-panel";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { applyActivitiesFilters } from "@/logic/activities";
import { useActivities } from "@/stores/activities";
import { usePanels } from "@/stores/panels";
import { useProjects } from "@/stores/projects";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

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
  const [activitiesFilters, setActivitiesFilters] = useState<ActivitiesFilters>(
    {},
  );

  const viewId = `project-${projectId}`;
  const defaultPanel = isMobile ? null : "summary";
  const panelState = usePanels((state) => state.getPanel(viewId, defaultPanel));
  const closePanel = usePanels((state) => state.closePanel);
  const setFullView = usePanels((state) => state.setFullView);

  const { search } = useViewSearch();
  const activityView = useViews((state) =>
    state.getActivityView("project-detail"),
  );

  // The analytics panel describes exactly what the table shows.
  const filteredActivities = useMemo(
    () =>
      applyActivitiesFilters(projectActivities, {
        search,
        viewFilters: activityView.filters,
        categoryFilter: activitiesFilters.category ?? null,
        subcategoryFilter: activitiesFilters.subcategory ?? null,
        activityTypeFilter: activitiesFilters.activityType ?? null,
      }),
    [
      projectActivities,
      search,
      activityView,
      activitiesFilters.category,
      activitiesFilters.subcategory,
      activitiesFilters.activityType,
    ],
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

  const panelOpen = panelState.panel !== null;
  const mainHidden = panelOpen && (isMobile || panelState.fullView);

  const panelTitle = panelState.panel
    ? SIDE_PANEL_LABELS[panelState.panel]
    : "Panel";
  const PanelIcon = panelState.panel
    ? SIDE_PANEL_ICONS[panelState.panel]
    : undefined;

  return (
    <SidebarInset className="flex-row">
      <div
        className={cn("flex min-w-0 flex-1 flex-col", mainHidden && "hidden")}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
          <SidebarTrigger className="mr-1" />
          <PageBreadcrumbs entries={breadcrumbs} />
          <div className="flex-1" />
          <AddActivityButton project={projectId} />
          <Button
            variant="outline"
            aria-label="Edit project"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <SidePanelToggles
            viewId={viewId}
            panels={["analytics", "summary"]}
            defaultPanel={defaultPanel}
          />

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

      {panelOpen && (
        <SidePanel
          title={panelTitle}
          icon={PanelIcon}
          onClose={() => closePanel(viewId)}
          fullView={panelState.fullView && panelState.panel === "analytics"}
          onToggleFullView={
            panelState.panel === "analytics"
              ? () => setFullView(viewId, !panelState.fullView)
              : undefined
          }
          scrollable={panelState.panel !== "analytics"}
        >
          {panelState.panel === "summary" && (
            <ProjectSummary
              project={project}
              activitiesFilters={activitiesFilters}
              onActivitiesFiltersChange={setActivitiesFilters}
            />
          )}

          {panelState.panel === "analytics" && (
            <ActivitiesAnalytics
              activities={filteredActivities}
              viewId="projects-activities"
              defaults={{
                y: "net",
                x: "month",
                groupBy: "type",
                chart: "bar",
              }}
              fullView={panelState.fullView}
            />
          )}
        </SidePanel>
      )}
    </SidebarInset>
  );
}
