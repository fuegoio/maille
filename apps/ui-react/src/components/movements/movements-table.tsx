import { verifyMovementFilter } from "@maille/core/movements";
import type { Movement } from "@maille/core/movements";
import { useHotkey } from "@tanstack/react-hotkeys";
import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useActivities } from "@/stores/activities";
import { useMovements } from "@/stores/movements";
import { useSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { MovementsFilters } from "./filters/movements-filters";
import { MovementLine } from "./movement-line";
import { MovementsActions } from "./movements-actions";

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
  const focusedMovement = useMovements((state) => state.focusedMovement);
  const focusedActivity = useActivities((state) => state.focusedActivity);
  const filterStringBySearch = useSearch((state) => state.filterStringBySearch);
  const movementView = useViews((state) => state.getMovementView(viewId));
  const setFocusedMovement = useMovements((state) => state.setFocusedMovement);
  const setFocusedActivity = useActivities((state) => state.setFocusedActivity);
  const [selectedMovements, setSelectedMovements] = React.useState<string[]>(
    [],
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (focusedMovement) {
        setFocusedMovement(null);
      }
      if (focusedActivity) {
        setFocusedActivity(null);
      }
    };
  }, []);

  // Reset focused activity when focused movement changes
  React.useEffect(() => {
    if (focusedMovement) {
      setFocusedActivity(null);
    }
  }, [focusedMovement]);

  const movementsFiltered = React.useMemo(() => {
    return movements
      .filter((movement) => filterStringBySearch(movement.name))
      .filter((movement) =>
        accountFilter !== null ? movement.account === accountFilter : true,
      )
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

  type MovementAndGroup =
    | ({ itemType: "group" } & Group)
    | ({ itemType: "movement" } & Movement);

  const movementsWithGroups = React.useMemo<MovementAndGroup[]>(() => {
    if (!grouping)
      return movementsSorted.map((m) => ({ itemType: "movement", ...m }));

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
        return mwg.concat(
          group.movements.map((m) => ({ itemType: "movement", ...m })),
        );
      }, []);
  }, [movementsSorted, grouping]);

  const periodFormatter = (month: number, year: number): string => {
    return new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  const handleMovementClick = (movementId: string) => {
    if (focusedMovement === movementId) {
      setFocusedMovement(null);
    } else {
      setFocusedMovement(movementId);
    }
  };

  const selectMovement = (movementId: string) => {
    setSelectedMovements((prev) =>
      prev.includes(movementId)
        ? prev.filter((id) => id !== movementId)
        : [...prev, movementId],
    );
  };

  // Hotkeys
  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    if (movementsSorted.length === 0) return;

    const currentIndex = movementsSorted.findIndex(
      (movement) => movement.id === focusedMovement,
    );

    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex - 1 + movementsSorted.length) % movementsSorted.length;

    setFocusedMovement(movementsSorted[nextIndex].id);
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    if (movementsSorted.length === 0) return;

    const currentIndex = movementsSorted.findIndex(
      (movement) => movement.id === focusedMovement,
    );

    const nextIndex = (currentIndex + 1) % movementsSorted.length;
    setFocusedMovement(movementsSorted[nextIndex].id);
  });

  useHotkey("Escape", () => {
    if (selectedMovements.length > 0) {
      setSelectedMovements([]);
    }
  });

  useHotkey("Mod+A", (event) => {
    if (event.key !== "a") return;
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
