import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, Plus } from "lucide-react";

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

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/projects",
    entries: [
      { key: "projects", label: "Projects", target: { to: "/projects" } },
    ],
  });

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

      <Tabs value="all" className="min-h-0 flex-1">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
          <TabsList
            height="full"
            className="min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 [&_[data-slot=tabs-trigger]]:after:bottom-0"
          >
            <TabsTrigger value="all">
              <FolderKanban />
              All projects
            </TabsTrigger>
          </TabsList>
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
      </Tabs>
    </SidebarInset>
  );
}
