import type { Project } from "@maille/core/projects";

import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Settings, SquareChartGantt } from "lucide-react";
import { useState } from "react";
import z from "zod";

import type { ActivitiesFilters } from "@/types/activities";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { ActivityViewSettingsButton } from "@/components/activities/activity-view-settings-button";
import { AddActivityButton } from "@/components/activities/add-activity-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { ActivityIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useProjects } from "@/stores/projects";

const searchParamsSchema = z.object({
  /** "activities", or a custom view's id. */
  view: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/projects/$id")({
  component: ProjectPageRoute,
  validateSearch: searchParamsSchema,
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
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "activities";
  const activities = useActivities((state) => state.activities);
  const projectActivities = activities.filter((a) => a.project === projectId);

  const isMobile = useIsMobile();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);
  const [activitiesFilters, setActivitiesFilters] = useState<ActivitiesFilters>(
    {},
  );

  const viewScope = { kind: "project", projectId } as const;
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

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
          {selectedCustomView === null && (
            <AddActivityButton project={projectId} />
          )}
          <Button
            variant="outline"
            aria-label="Edit project"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          {!summaryOpen && (
            <Button
              variant="default"
              aria-label="Show summary"
              onClick={() => setSummaryOpen(true)}
            >
              <SquareChartGantt />
              <span className="hidden sm:inline">Summary</span>
              <ChevronRight className="hidden sm:block" />
            </Button>
          )}

          <ProjectSettingsDialog
            project={project}
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
          />
        </header>

        <Tabs
          value={selectedTab}
          onValueChange={(value) =>
            navigate({
              to: ".",
              search: (prev) => ({
                ...prev,
                view: value === "activities" ? undefined : value,
              }),
            })
          }
          className="min-h-0 flex-1"
        >
          <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
            <TabsList
              height="full"
              className="min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 [&_[data-slot=tabs-trigger]]:after:bottom-0"
            >
              <TabsTrigger value="activities">
                <ActivityIcon />
                Activities
              </TabsTrigger>
              <CustomViewTabs
                scope={viewScope}
                onSelect={(value) =>
                  navigate({
                    to: ".",
                    search: (prev) => ({ ...prev, view: value }),
                  })
                }
              />
            </TabsList>
            <div className="flex-1" />
            {selectedCustomView !== null ? (
              <CustomViewActions
                view={selectedCustomView}
                onConfigChange={(config) =>
                  updateViewConfig(selectedCustomView, config)
                }
                onDeleted={() =>
                  navigate({
                    to: ".",
                    search: (prev) => ({ ...prev, view: undefined }),
                  })
                }
              />
            ) : (
              <>
                <FilterActivitiesButton viewId="project-detail" />
                <ActivityViewSettingsButton
                  viewId="project-detail"
                  hideProject
                />
                <ExportActivitiesButton
                  viewId="project-detail"
                  activities={projectActivities}
                  className="hidden sm:flex"
                />
              </>
            )}
          </header>

          <TabsContent value="activities" className="flex h-full">
            <ActivitiesTable
              viewId="project-detail"
              activities={projectActivities}
              hideProject={true}
              activityTypeFilter={activitiesFilters.activityType}
              categoryFilter={activitiesFilters.category}
              subcategoryFilter={activitiesFilters.subcategory}
            />
          </TabsContent>

          <CustomViewTabsContent scope={viewScope} />
        </Tabs>
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
