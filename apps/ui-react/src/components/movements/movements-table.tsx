import type { Movement } from "@maille/core/movements";

import { verifyMovementFilter } from "@maille/core/movements";
import * as React from "react";

import { useContextNavigate } from "@/components/navigation/breadcrumbs";
import { EntityContextMenu } from "@/components/shared/entity-actions";
import { TableGroupHeader } from "@/components/shared/table-group-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupedRows } from "@/hooks/use-grouped-rows";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { searchCompare } from "@/lib/strings";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { MovementsFilters } from "./filters/movements-filters";
import { MovementLine } from "./movement-line";
import { useMovementsEntityActions } from "./movements-actions";
import { MovementsSelection } from "./movements-selection";

interface MovementsTableProps {
  movements: Movement[];
  viewId: string;
  grouping?: "period" | null;
  accountFilter?: string | null;
}

export function MovementsTable({
  movements,
  viewId,
  grouping = null,
  accountFilter = null,
}: MovementsTableProps) {
  const contextNavigate = useContextNavigate();
  const { search } = useViewSearch();
  const movementView = useViews((state) => state.getMovementView(viewId));
  const scrollRef = useScrollRestoration<HTMLDivElement>(`movements:${viewId}`);

  const movementsFiltered = React.useMemo(() => {
    return movements
      .filter((movement) => searchCompare(search, movement.name))
      .filter((movement) =>
        accountFilter !== null ? movement.account === accountFilter : true,
      )
      .filter((movement) => {
        if (movementView.filters.length === 0) return true;
        return movementView.filters
          .map((filter) => verifyMovementFilter(filter, movement))
          .every((f) => f);
      });
  }, [movements, search, accountFilter, movementView.filters]);

  const movementsSorted = React.useMemo(() => {
    return [...movementsFiltered].sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [movementsFiltered]);

  const { items, isFolded, toggleGroup } = useGroupedRows(
    movementsSorted,
    grouping !== null,
  );

  const rows = React.useMemo<TableRow[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        selectable: item.itemType === "row",
      })),
    [items],
  );

  const {
    rowOutlines,
    registerRow,
    selectedIds: selectedMovements,
    toggle: toggleMovement,
    selectOnly: selectOnlyMovement,
    clearSelection: clearSelectedMovements,
  } = useTableRows({
    rows,
    checkable: true,
    onOpen: (id) => {
      void contextNavigate({ to: "/movements/$id", params: { id } });
    },
  });

  const entityActions = useMovementsEntityActions(
    selectedMovements,
    clearSelectedMovements,
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <MovementsFilters viewId={viewId} movements={movementsFiltered} />

      <div className="flex flex-1 flex-col overflow-y-auto">
        {movementsFiltered.length !== 0 ? (
          <ScrollArea className="flex-1" viewportRef={scrollRef}>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.itemType === "group" ? (
                  <TableGroupHeader
                    id={item.id}
                    folded={isFolded(item.id)}
                    onToggle={toggleGroup}
                    month={item.month}
                    year={item.year}
                  />
                ) : (
                  <EntityContextMenu
                    actions={entityActions}
                    onActionComplete={clearSelectedMovements}
                  >
                    <div
                      ref={registerRow(item.id)}
                      onContextMenu={() => {
                        if (!selectedMovements.includes(item.id)) {
                          selectOnlyMovement(item.id);
                        }
                      }}
                    >
                      <MovementLine
                        movement={item}
                        checked={selectedMovements.includes(item.id)}
                        outlineSides={rowOutlines.get(item.id)}
                        onCheckedChange={(event) =>
                          toggleMovement(item.id, event)
                        }
                      />
                    </div>
                  </EntityContextMenu>
                )}
              </React.Fragment>
            ))}
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <div className="text-sm text-muted-foreground">
              No movement found.
            </div>
          </div>
        )}
      </div>

      <MovementsSelection
        selectedMovements={selectedMovements}
        onClearSelection={clearSelectedMovements}
      />
    </div>
  );
}
