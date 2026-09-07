import { createFileRoute, Link } from "@tanstack/react-router";

import { AddMovementButton } from "@/components/movements/add-movement-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { ImportMovementsButton } from "@/components/movements/import-movements-button";
import { MovementsTable } from "@/components/movements/movements-table";
import { SearchBar } from "@/components/search-bar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useMovements } from "@/stores/movements";
import { useViews } from "@/stores/views";

export const Route = createFileRoute("/_authenticated/movements/to-link")({
  component: ToLinkPage,
});

function ToLinkPage() {
  const movements = useMovements((state) => state.movements);

  const movementsView = useViews((state) =>
    state.getMovementView("activities-to-link-page"),
  );

  const viewMovements = movements.filter(
    (movement) => movement.status === "incomplete",
  );

  return (
    <SidebarInset className="min-w-0 shrink">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b pr-2 pl-3 sm:gap-2 sm:pl-4">
        <SidebarTrigger className="mr-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/movements">Movements</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>To link</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <FilterMovementsButton
          viewId={movementsView.id}
          className="ml-2 text-muted-foreground"
        />
        <div className="flex-1" />
        <SearchBar />
        <ImportMovementsButton className="hidden sm:flex" />
        <AddMovementButton />
      </header>

      <MovementsTable
        viewId={movementsView.id}
        movements={viewMovements}
        grouping="period"
      />
    </SidebarInset>
  );
}
