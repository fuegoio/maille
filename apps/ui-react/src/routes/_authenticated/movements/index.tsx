import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";

import { AddMovementButton } from "@/components/movements/add-movement-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { ImportMovementsButton } from "@/components/movements/import-movements-button";
import { MovementsTable } from "@/components/movements/movements-table";
import {
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMovements } from "@/stores/movements";
import { useViews } from "@/stores/views";

export const Route = createFileRoute("/_authenticated/movements/")({
  component: MovementsPage,
});

function MovementsPage() {
  const movements = useMovements((state) => state.movements);

  const movementsView = useViews((state) =>
    state.getMovementView("activities-page"),
  );

  const breadcrumbs = usePageBreadcrumbs({
    contextual: false,
    routeKey: "/movements",
    entries: [{ key: "movements", label: "Movements" }],
  });

  return (
    <SidebarInset className="min-w-0 shrink">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b pr-2 pl-3 sm:gap-2 sm:pl-4">
        <SidebarTrigger className="mr-1" />
        <PageBreadcrumbs entries={breadcrumbs} />
        <FilterMovementsButton
          viewId={movementsView.id}
          className="ml-2 text-muted-foreground"
        />
        <div className="flex-1" />
        <SearchBar />
        <ImportMovementsButton className="hidden sm:flex" />
        <AddMovementButton />
        <div className="hidden h-full w-px bg-border sm:block" />
        <Tooltip>
          <TooltipTrigger asChild className="hidden sm:flex">
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export movements</p>
          </TooltipContent>
        </Tooltip>
      </header>

      <MovementsTable
        viewId={movementsView.id}
        movements={movements}
        grouping="period"
      />
    </SidebarInset>
  );
}
