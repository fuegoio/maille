import { createFileRoute } from "@tanstack/react-router";
import { Folder, Plus } from "lucide-react";

import { CategoriesTable } from "@/components/categories/categories-table";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { PageBar } from "@/components/shared/page-bars";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      <Tabs value="all" className="min-h-0 flex-1">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
          <TabsList
            height="full"
            className="min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 [&_[data-slot=tabs-trigger]]:after:bottom-0"
          >
            <TabsTrigger value="all">
              <Folder />
              All categories
            </TabsTrigger>
          </TabsList>
        </header>

        <TabsContent value="all" className="flex h-full">
          <CategoriesTable />
        </TabsContent>
      </Tabs>
    </SidebarInset>
  );
}
