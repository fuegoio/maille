import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectsTable } from "@/components/projects/projects-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1" />
        <CreateProjectDialog>
          <Button>
            <Plus />
            <span>New project</span>
          </Button>
        </CreateProjectDialog>
      </header>

      <header className="flex h-8 items-center gap-4 border-b bg-muted/50 pr-6 pl-6 text-xs font-medium text-muted-foreground">
        <div>Project</div>
        <div className="flex-1" />
        <div className="w-32 text-right">Activities</div>
        <div className="w-32 text-right">Revenue</div>
        <div className="w-32 text-right">Investment</div>
        <div className="w-32 text-right">Expenses</div>
        <div className="w-32 text-right">Neutral</div>
      </header>

      <ProjectsTable />
    </SidebarInset>
  );
}
