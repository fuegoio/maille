import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CategoriesTable } from "@/components/categories/categories-table";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { LedgerHeaderStrip, PageBar } from "@/components/shared/page-bars";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated/categories/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/categories",
    entries: [
      { key: "categories", label: "Categories", target: { to: "/categories" } },
    ],
  });

  return (
    <SidebarInset className="min-w-0">
      <PageBar>
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <CreateCategoryDialog>
          <Button
            aria-label="Create category"
            className="w-8 px-0 sm:w-auto sm:px-2.5"
          >
            <Plus />
            <span className="hidden sm:inline">Create category</span>
          </Button>
        </CreateCategoryDialog>
      </PageBar>

      <LedgerHeaderStrip>
        <div>Category</div>
        <div className="flex-1" />
        <div className="text-right">Activities</div>
        <div className="w-32 text-right">Total</div>
      </LedgerHeaderStrip>

      <CategoriesTable />
    </SidebarInset>
  );
}
