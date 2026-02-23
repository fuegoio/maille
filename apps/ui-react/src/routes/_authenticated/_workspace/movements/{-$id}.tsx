import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo } from "react";

import { AddMovementButton } from "@/components/movements/add-movement-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import { ImportMovementsButton } from "@/components/movements/import-movements-button";
import { Movement } from "@/components/movements/movement";
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
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMovements } from "@/stores/movements";
import { useViews } from "@/stores/views";

export const Route = createFileRoute(
  "/_authenticated/_workspace/movements/{-$id}",
)({
  component: MovementsPage,
  loader: async ({ params }) => {
    const setFocusedMovement = useMovements.getState().setFocusedMovement;
    if (params.id && params.id !== "to-link" && params.id !== "") {
      const movements = useMovements.getState().movements;
      const movement = movements.find((m) => m.id === params.id);
      if (movement) {
        setFocusedMovement(movement.id);
      }
    } else {
      setFocusedMovement(null);
    }
  },
});

function MovementsPage() {
  const params = Route.useParams();
  const movements = useMovements((state) => state.movements);
  const focusedMovement = useMovements((state) => state.focusedMovement);

  const movementsView = useViews((state) =>
    state.getMovementView(
      params.id === "to-link" ? "activities-to-link-page" : "activities-page",
    ),
  );

  const viewMovements = useMemo(() => {
    if (params.id === "to-link") {
      return movements.filter((movement) => movement.status === "incomplete");
    }
    return movements;
  }, [movements, params.id]);

  const title = params.id === "to-link" ? "To link" : "Movements";

  return (
    <>
      <SidebarInset
        className={cn("min-w-0 shrink", focusedMovement && "hidden xl:flex")}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-3 sm:pl-4">
          <SidebarTrigger className="mr-1" />
          <Breadcrumb>
            <BreadcrumbList>
              {params.id === "to-link" && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/movements/{-$id}" params={{ id: undefined }}>
                        Movements
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />
          <ImportMovementsButton />
          <AddMovementButton />
          <div className="h-full w-px bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export movements</p>
            </TooltipContent>
          </Tooltip>
        </header>

        <header className="flex h-11 shrink-0 items-center gap-2 border-b px-2 sm:pl-11.25">
          {movementsView.filters.length === 0 && (
            <FilterMovementsButton viewId={movementsView.id} />
          )}
          <div className="flex-1" />
          <SearchBar />
        </header>

        <MovementsTable
          viewId={movementsView.id}
          movements={viewMovements}
          grouping="period"
        />
      </SidebarInset>

      <Movement />
    </>
  );
}
