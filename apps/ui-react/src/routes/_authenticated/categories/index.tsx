import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Folder, Plus } from "lucide-react";
import z from "zod";

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

export const Route = createFileRoute("/_authenticated/categories/")({
  component: CategoriesPage,
  validateSearch: searchParamsSchema,
});

/** The scope this page's custom views attach to. */
const viewScope = { kind: "page", page: "categories" } as const;

function CategoriesPage() {
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "all";
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/categories",
    entries: [
      { key: "categories", label: "Categories", target: { to: "/categories" } },
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
              <Folder />
              All categories
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

        <TabsContent value="all" className="flex h-full">
          <CategoriesTable />
        </TabsContent>

        <CustomViewTabsContent scope={viewScope} />
      </Tabs>
    </SidebarInset>
  );
}
