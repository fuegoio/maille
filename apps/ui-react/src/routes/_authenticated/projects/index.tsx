import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectsTable } from "@/components/projects/projects-table";
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
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <CreateProjectDialog>
          <Button aria-label="New project">
            <Plus />
            <span className="hidden sm:inline">New project</span>
          </Button>
        </CreateProjectDialog>
      </header>

      <header className="flex h-8 items-center gap-4 border-b bg-muted/50 pr-6 pl-6 text-xs font-medium text-muted-foreground">
        <div>Project</div>
        <div className="flex-1" />
        <div className="hidden w-32 text-right lg:block">Activities</div>
        <div className="hidden w-32 text-right sm:block">Revenue</div>
        <div className="hidden w-32 text-right lg:block">Investment</div>
        <div className="w-32 text-right">Expenses</div>
        <div className="hidden w-32 text-right lg:block">Neutral</div>
      </header>

      <ProjectsTable />
    </SidebarInset>
  );
}
