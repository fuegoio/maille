import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CategoriesTable } from "@/components/categories/categories-table";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/categories",
    entries: [{ key: "categories", label: "Categories" }],
  });

  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-4 pl-4">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
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
