import type { Movement } from "@maille/core/movements";

import { verifyMovementFilter } from "@maille/core/movements";
import * as React from "react";

import { useContextNavigate } from "@/components/navigation/breadcrumbs";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import { EntityContextMenu } from "@/components/shared/entity-actions";
import { TableGroupHeader } from "@/components/shared/table-group-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGroupedRows } from "@/hooks/use-grouped-rows";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { searchCompare } from "@/lib/strings";
import { viewGroupOrder } from "@/lib/view-grouping";
import { sortViewRows } from "@/lib/view-ordering";
import { useAccounts } from "@/stores/accounts";
import { useViewSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { MovementsFilters } from "./filters/movements-filters";
import { MovementLine } from "./movement-line";
import {
  movementGroupAccessors,
  movementOrderingAccessors,
} from "./movement-view";
import { useMovementsEntityActions } from "./movements-actions";
import { MovementsSelection } from "./movements-selection";

interface MovementsTableProps {
  movements: Movement[];
  viewId: string;
  accountFilter?: string | null;
}

export function MovementsTable({
  movements,
  viewId,
  accountFilter = null,
}: MovementsTableProps) {
  const contextNavigate = useContextNavigate();
  const { search } = useViewSearch();
  const accounts = useAccounts((state) => state.accounts);
  const groupAccessors = React.useMemo(
    () => movementGroupAccessors(accounts),
    [accounts],
  );
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

  const movementsSorted = React.useMemo(
    () =>
      sortViewRows(
        movementsFiltered,
        movementView.ordering,
        movementOrderingAccessors,
      ),
    [movementsFiltered, movementView.ordering],
  );
  const { items, isFolded, toggleGroup } = useGroupedRows(
    movementsSorted,
    movementView.grouping,
    groupAccessors,
    viewGroupOrder(movementView.grouping, movementView.ordering),
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
                    label={item.label}
                    shortLabel={item.shortLabel}
                    calendar={item.calendar}
                    count={item.rows.length}
                  >
                    {/* Movements are signed: in sums the positives, out the
                     * negatives, displayed positively with its dot. */}
                    {movementView.fields.includes("amount") && (
                      <AmountPairsValue
                        pairs={[
                          {
                            dot: "bg-green-400",
                            amount: item.rows.reduce(
                              (sum, movement) =>
                                sum + Math.max(movement.amount, 0),
                              0,
                            ),
                          },
                          {
                            dot: "bg-red-400",
                            amount: -item.rows.reduce(
                              (sum, movement) =>
                                sum + Math.min(movement.amount, 0),
                              0,
                            ),
                          },
                        ]}
                        className="text-sm"
                      />
                    )}
                  </TableGroupHeader>
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
                        fields={movementView.fields}
                        fullDate={movementView.grouping !== "period"}
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
