import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderKanban, Plus } from "lucide-react";
import z from "zod";

import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectsTable } from "@/components/projects/projects-table";
import { LedgerHeaderStrip, PageBar } from "@/components/shared/page-bars";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";

const searchParamsSchema = z.object({
  /** "all", or a custom view's id. */
  view: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
  validateSearch: searchParamsSchema,
});

/** The scope this page's custom views attach to. */
const viewScope = { kind: "page", page: "projects" } as const;

function ProjectsPage() {
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "all";
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/projects",
    entries: [
      { key: "projects", label: "Projects", target: { to: "/projects" } },
    ],
  });

  const selectTab = (value: string) => {
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        view: value === "all" ? undefined : value,
      }),
    });
  };

  return (
    <SidebarInset className="min-w-0">
      <PageBar>
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <CreateProjectDialog>
          <Button
            aria-label="New project"
            className="w-8 px-0 sm:w-auto sm:px-2.5"
          >
            <Plus />
            <span className="hidden sm:inline">New project</span>
          </Button>
        </CreateProjectDialog>
      </PageBar>

      <Tabs
        value={selectedTab}
        onValueChange={selectTab}
        className="min-h-0 flex-1"
      >
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
          <TabsList
            height="full"
            className="min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 [&_[data-slot=tabs-trigger]]:after:bottom-0"
          >
            <TabsTrigger value="all">
              <FolderKanban />
              All projects
            </TabsTrigger>
            <CustomViewTabs scope={viewScope} onSelect={selectTab} />
          </TabsList>
          <div className="flex-1" />
          {selectedCustomView !== null && (
            <CustomViewActions
              view={selectedCustomView}
              onConfigChange={(config) =>
                updateViewConfig(selectedCustomView, config)
              }
            />
          )}
        </header>

        <TabsContent value="all" className="flex h-full flex-col">
          <LedgerHeaderStrip>
            <div>Project</div>
            <div className="flex-1" />
            <div className="hidden w-32 text-right lg:block">Activities</div>
            <div className="hidden w-32 text-right sm:block">Revenue</div>
            <div className="hidden w-32 text-right lg:block">Investment</div>
            <div className="w-32 text-right">Expenses</div>
            <div className="hidden w-32 text-right lg:block">Neutral</div>
          </LedgerHeaderStrip>

          <ProjectsTable />
        </TabsContent>

        <CustomViewTabsContent scope={viewScope} />
      </Tabs>
    </SidebarInset>
  );
}
