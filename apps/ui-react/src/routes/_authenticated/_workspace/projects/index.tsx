import { createFileRoute } from "@tanstack/react-router";

import { AddAndEditProjectModal } from "@/components/projects/add-and-edit-project-modal";
import { ProjectsTable } from "@/components/projects/projects-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/_workspace/projects/")({
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
        <AddAndEditProjectModal />
      </header>

      <div className="flex flex-1 flex-col">
        <ProjectsTable />
      </div>
    </SidebarInset>
  );
}
