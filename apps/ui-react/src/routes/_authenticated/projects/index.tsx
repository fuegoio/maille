import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectsTable } from "@/components/projects/projects-table";
import { LedgerHeaderStrip, PageBar } from "@/components/shared/page-bars";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

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
    </SidebarInset>
  );
}
