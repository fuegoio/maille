import * as React from "react";
import { useStore } from "zustand";
import { movementsStore } from "@/stores/movements";
import { viewsStore } from "@/stores/views";
import { searchStore } from "@/stores/search";
import { activitiesStore } from "@/stores/activities";
import { MovementLine } from "./movement-line";
import { MovementsFilters } from "./filters/movements-filters";
import { MovementsActions } from "./movements-actions";
import { verifyMovementFilter } from "@maille/core/movements";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useHotkeys } from "react-hotkeys-hook";
import type { Movement } from "@maille/core/movements";
import type { UUID } from "crypto";

interface MovementsTableProps {
  movements: Movement[];
  viewId: string;
  grouping?: "period" | null;
  accountFilter?: UUID | null;
}

export function MovementsTable({
  movements,
  viewId,
  grouping = null,
  accountFilter = null,
}: MovementsTableProps) {
  const focusedMovement = useStore(movementsStore, (state) => state.focusedMovement);
  const focusedActivity = useStore(activitiesStore, (state) => state.focusedActivity);
  const filterStringBySearch = useStore(searchStore, (state) => state.filterStringBySearch);
  const movementView = useStore(viewsStore, (state) => state.getMovementView(viewId));
  const [selectedMovements, setSelectedMovements] = React.useState<UUID[]>([]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (focusedMovement) {
        movementsStore.getState().setFocusedMovement(null);
      }
      if (focusedActivity) {
        activitiesStore.getState().setFocusedActivity(null);
      }
    };
  }, []);

  // Reset focused activity when focused movement changes
  React.useEffect(() => {
    if (focusedMovement) {
      activitiesStore.getState().setFocusedActivity(null);
    }
  }, [focusedMovement]);

  const movementsFiltered = React.useMemo(() => {
    return movements
      .filter((movement) => filterStringBySearch(movement.name))
      .filter((movement) => (accountFilter !== null ? movement.account === accountFilter : true))
      .filter((movement) => {
        if (movementView.filters.length === 0) return true;
        return movementView.filters
          .map((filter) => verifyMovementFilter(filter, movement))
          .every((f) => f);
      });
  }, [movements, filterStringBySearch, accountFilter, movementView.filters]);

  const movementsSorted = React.useMemo(() => {
    return [...movementsFiltered].sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return b.date.getTime() - a.date.getTime();
      }
      return b.id.localeCompare(a.id);
    });
  }, [movementsFiltered]);

  type Group = {
    id: string;
    month: number;
    year: number;
    movements: Movement[];
  };

  type MovementAndGroup = ({ itemType: "group" } & Group) | ({ itemType: "movement" } & Movement);

  const movementsWithGroups = React.useMemo<MovementAndGroup[]>(() => {
    if (!grouping) return movementsSorted.map((m) => ({ itemType: "movement", ...m }));

    const groups = movementsSorted.reduce((groups: Group[], m) => {
      const month = m.date.getMonth();
      const year = m.date.getFullYear();
      const group = groups.find((p) => p.month === month && p.year === year);

      if (group) {
        group.movements.push(m);
      } else {
        groups.push({
          id: `${month}-${year}`,
          month,
          year,
          movements: [m],
        });
      }

      return groups;
    }, []);

    return groups
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .reduce((mwg: MovementAndGroup[], group) => {
        mwg.push({
          itemType: "group",
          id: group.id,
          month: group.month,
          year: group.year,
        });
        return mwg.concat(group.movements.map((m) => ({ itemType: "movement", ...m })));
      }, []);
  }, [movementsSorted, grouping]);

  const periodFormatter = (month: number, year: number): string => {
    return new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });
  };

  const handleMovementClick = (movementId: UUID) => {
    if (focusedMovement === movementId) {
      movementsStore.getState().setFocusedMovement(null);
    } else {
      movementsStore.getState().setFocusedMovement(movementId);
    }
  };

  const selectMovement = (movementId: UUID) => {
    setSelectedMovements((prev) =>
      prev.includes(movementId) ? prev.filter((id) => id !== movementId) : [...prev, movementId],
    );
  };

  // Hotkeys
  useHotkeys("k", () => {
    if (movementsSorted.length === 0) return;

    const currentIndex = movementsSorted.findIndex((movement) => movement.id === focusedMovement);

    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex - 1 + movementsSorted.length) % movementsSorted.length;

    movementsStore.getState().setFocusedMovement(movementsSorted[nextIndex].id);
  });

  useHotkeys("j", () => {
    if (movementsSorted.length === 0) return;

    const currentIndex = movementsSorted.findIndex((movement) => movement.id === focusedMovement);

    const nextIndex = (currentIndex + 1) % movementsSorted.length;
    movementsStore.getState().setFocusedMovement(movementsSorted[nextIndex].id);
  });

  useHotkeys("escape", () => {
    if (selectedMovements.length > 0) {
      setSelectedMovements([]);
    }
  });

  useHotkeys("ctrl+a,meta+a", () => {
    setSelectedMovements(movementsFiltered.map((m) => m.id));
  });

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <MovementsFilters viewId={viewId} movements={movementsFiltered} />

      <div className="flex flex-1 flex-col overflow-x-hidden sm:min-w-[575px]">
        {movementsFiltered.length !== 0 ? (
          <ScrollArea className="flex-1 pb-40">
            {grouping
              ? movementsWithGroups.map((item) => (
                  <React.Fragment key={item.id}>
                    {item.itemType === "group" ? (
                      <div className="bg-primary-800 flex h-10 flex-shrink-0 items-center gap-2 border-b pl-5 sm:pl-7">
                        <i
                          className="mdi mdi-calendar-blank text-primary-100 mdi-16px"
                          aria-hidden="true"
                        />
                        <div className="text-sm font-medium">
                          {periodFormatter(item.month, item.year)}
                        </div>
                        <div className="flex-1" />
                      </div>
                    ) : (
                      <MovementLine
                        movement={item}
                        isMovementSelected={selectedMovements.includes(item.id)}
                        onSelectMovement={() => selectMovement(item.id)}
                        onClick={() => handleMovementClick(item.id)}
                      />
                    )}
                  </React.Fragment>
                ))
              : movementsSorted.map((movement) => (
                  <MovementLine
                    key={movement.id}
                    movement={movement}
                    isMovementSelected={selectedMovements.includes(movement.id)}
                    onSelectMovement={() => selectMovement(movement.id)}
                    onClick={() => handleMovementClick(movement.id)}
                  />
                ))}
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <div className="text-primary-600">No movement found</div>
          </div>
        )}
      </div>

      <MovementsActions
        selectedMovements={selectedMovements}
        onClearSelection={() => setSelectedMovements([])}
      />
    </div>
  );
}
