import { verifyMovementFilter } from "@maille/core/movements";
import type { Movement } from "@maille/core/movements";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Calendar, ChevronDown } from "lucide-react";
import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
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
  const search = useSearch((state) => state.search);
  const movementView = useViews((state) => state.getMovementView(viewId));
  const setFocusedMovement = useMovements((state) => state.setFocusedMovement);
  const [selectedMovements, setSelectedMovements] = React.useState<string[]>(
    [],
  );
  const [groupsFolded, setGroupsFolded] = React.useState<string[]>([]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      setFocusedMovement(null);
    };
  }, [setFocusedMovement]);

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
          movements: group.movements,
        });
        if (!groupsFolded.includes(group.id)) {
          return mwg.concat(
            group.movements.map((m) => ({ itemType: "movement", ...m })),
          );
        } else {
          return mwg;
        }
      }, []);
  }, [movementsSorted, grouping, groupsFolded]);

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

  useHotkey(
    "Escape",
    () => {
      if (selectedMovements.length > 0) {
        setSelectedMovements([]);
      }
    },
    {
      conflictBehavior: "allow",
    },
  );

  useHotkey(
    "Mod+A",
    (event) => {
      if (event.key !== "a") return;
      setSelectedMovements(movementsFiltered.map((m) => m.id));
    },
    {
      ignoreInputs: true,
    },
  );

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
                      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 px-5 sm:px-6">
                        <ChevronDown
                          className={cn(
                            "mr-3 size-3 opacity-20 transition-all hover:opacity-100",
                            groupsFolded.includes(item.id) &&
                              "-rotate-90 opacity-100",
                          )}
                          onClick={() => {
                            if (groupsFolded.includes(item.id)) {
                              setGroupsFolded((prev) =>
                                prev.filter((id) => id !== item.id),
                              );
                            } else {
                              setGroupsFolded((prev) => [...prev, item.id]);
                            }
                          }}
                        />
                        <Calendar className="size-4" />
                        <div className="text-sm">
                          {periodFormatter(item.month, item.year)}
                        </div>
                        <div className="flex-1" />
                      </div>
                    ) : (
                      <MovementLine
                        movement={item}
                        selected={focusedMovement === item.id}
                        checked={selectedMovements.includes(item.id)}
                        onCheckedChange={() => selectMovement(item.id)}
                        onClick={() => handleMovementClick(item.id)}
                      />
                    )}
                  </React.Fragment>
                ))
              : movementsSorted.map((movement) => (
                  <MovementLine
                    key={movement.id}
                    movement={movement}
                    selected={focusedMovement === movement.id}
                    checked={selectedMovements.includes(movement.id)}
                    onCheckedChange={() => selectMovement(movement.id)}
                    onClick={() => handleMovementClick(movement.id)}
                  />
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

      <MovementsActions
        selectedMovements={selectedMovements}
        onClearSelection={() => setSelectedMovements([])}
      />
    </div>
  );
}
