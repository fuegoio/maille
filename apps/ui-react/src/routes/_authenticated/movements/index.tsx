import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link2 } from "lucide-react";
import z from "zod";

import { AddMovementButton } from "@/components/movements/add-movement-button";
import { ExportMovementsButton } from "@/components/movements/export-movements-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { ImportMovementsButton } from "@/components/movements/import-movements-button";
import { MovementsTable } from "@/components/movements/movements-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { PageBar } from "@/components/shared/page-bars";
import { TableViewSettingsButton } from "@/components/shared/table-view-settings-button";
import { ViewActions } from "@/components/shared/view-actions";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomViewActions } from "@/components/views/custom-view-actions";
import { useViewMutations } from "@/components/views/view-mutations";
import {
  CustomViewTabs,
  CustomViewTabsContent,
  useSelectedView,
} from "@/components/views/view-tabs";
import { MovementIcon } from "@/lib/icons";
import { useMovements } from "@/stores/movements";
import { useViews } from "@/stores/views";

const searchParamsSchema = z.object({
  /** "all", "to-link", or a custom view's id. */
  view: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/movements/")({
  component: MovementsPage,
  validateSearch: searchParamsSchema,
});

/** The scope this page's custom views attach to. */
const viewScope = { kind: "page", page: "movements" } as const;

function MovementsPage() {
  const movements = useMovements((state) => state.movements);
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const selectedTab = view ?? "all";
  const builtInViewId =
    selectedTab === "to-link" ? "activities-to-link-page" : "activities-page";
  const movementView = useViews((state) =>
    state.getMovementView(builtInViewId),
  );
  const selectedCustomView = useSelectedView(viewScope, selectedTab);
  const { updateViewConfig } = useViewMutations();

  const viewMovements =
    selectedTab === "to-link"
      ? movements.filter((movement) => movement.status === "incomplete")
      : movements;

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/movements",
    entries: [
      { key: "movements", label: "Movements", target: { to: "/movements" } },
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
    <SidebarInset className="min-w-0 shrink">
      <PageBar className="gap-1 pr-2 sm:gap-2">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <div className="flex-1" />
        <SearchBar />
        <ImportMovementsButton className="hidden sm:flex" />
        <AddMovementButton />
      </PageBar>

      <Tabs
        value={selectedTab}
        onValueChange={selectTab}
        className="min-h-0 flex-1"
      >
        <header className="@container flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
          <TabsList
            height="full"
            className="min-w-0 justify-start overflow-x-auto overflow-y-hidden sm:ml-5 [&_[data-slot=tabs-trigger]]:after:bottom-0"
          >
            <TabsTrigger value="all">
              <MovementIcon />
              All movements
            </TabsTrigger>
            <TabsTrigger value="to-link">
              <Link2 />
              To link
            </TabsTrigger>
            <CustomViewTabs scope={viewScope} onSelect={selectTab} />
          </TabsList>
          <div className="flex-1" />
          {selectedCustomView !== null ? (
            <CustomViewActions
              view={selectedCustomView}
              onConfigChange={(config) =>
                updateViewConfig(selectedCustomView, config)
              }
              onDeleted={() => selectTab("all")}
            />
          ) : (
            <>
              <ViewActions>
                <FilterMovementsButton
                  key={builtInViewId}
                  viewId={builtInViewId}
                />
                <TableViewSettingsButton
                  kind="movement"
                  viewId={builtInViewId}
                />
                <ExportMovementsButton
                  movements={viewMovements}
                  filters={movementView.filters}
                />
              </ViewActions>
            </>
          )}
        </header>

        <TabsContent value="all" className="flex h-full">
          <MovementsTable viewId="activities-page" movements={movements} />
        </TabsContent>

        <TabsContent value="to-link" className="flex h-full">
          <MovementsTable
            viewId="activities-to-link-page"
            movements={viewMovements}
          />
        </TabsContent>

        <CustomViewTabsContent scope={viewScope} />
      </Tabs>
    </SidebarInset>
  );
}
