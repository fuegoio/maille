import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CategoriesTable } from "@/components/categories/categories-table";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/_workspace/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Categories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1" />
        <CreateCategoryDialog>
          <Button variant="default">
            <Plus />
            Create category
          </Button>
        </CreateCategoryDialog>
      </header>

      <CategoriesTable />
    </SidebarInset>
  );
}
