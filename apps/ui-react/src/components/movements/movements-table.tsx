import type { Movement } from "@maille/core/movements";

import { verifyMovementFilter } from "@maille/core/movements";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import { Calendar, ChevronDown } from "lucide-react";
import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { searchCompare } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { useSearch } from "@/stores/search";
import { useViews } from "@/stores/views";

import { MovementsFilters } from "./filters/movements-filters";
import { MovementLine } from "./movement-line";
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
  const router = useRouter();
  const search = useSearch((state) => state.search);
  const movementView = useViews((state) => state.getMovementView(viewId));
  const scrollRef = useScrollRestoration<HTMLDivElement>(`movements:${viewId}`);
  const [selectedMovements, setSelectedMovements] = React.useState<string[]>(
    [],
  );
  const [groupsFolded, setGroupsFolded] = React.useState<string[]>([]);

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

  const selectMovement = (movementId: string) => {
    setSelectedMovements((prev) =>
      prev.includes(movementId)
        ? prev.filter((id) => id !== movementId)
        : [...prev, movementId],
    );
  };

  // Hotkeys: open the first movement of the list, then continue with J/K on
  // the movement page
  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    if (movementsSorted.length === 0) return;

    void router.navigate({
      to: "/movements/$id",
      params: { id: movementsSorted[0].id },
      replace: true,
    });
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    if (movementsSorted.length === 0) return;

    void router.navigate({
      to: "/movements/$id",
      params: { id: movementsSorted[0].id },
      replace: true,
    });
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

      <div className="flex flex-1 flex-col overflow-y-auto">
        {movementsFiltered.length !== 0 ? (
          <ScrollArea className="flex-1 pb-40" viewportRef={scrollRef}>
            {grouping
              ? movementsWithGroups.map((item) => (
                  <React.Fragment key={item.id}>
                    {item.itemType === "group" ? (
                      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/70 pr-2 pl-5 sm:px-6">
                        <ChevronDown
                          className={cn(
                            "mr-2 size-3 opacity-20 transition-all hover:opacity-100 sm:mr-3",
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
                        <Calendar className="hidden size-4 sm:block" />
                        <div className="text-sm">
                          {periodFormatter(item.month, item.year)}
                        </div>
                        <div className="flex-1" />
                      </div>
                    ) : (
                      <MovementLine
                        movement={item}
                        checked={selectedMovements.includes(item.id)}
                        onCheckedChange={() => selectMovement(item.id)}
                      />
                    )}
                  </React.Fragment>
                ))
              : movementsSorted.map((movement) => (
                  <MovementLine
                    key={movement.id}
                    movement={movement}
                    checked={selectedMovements.includes(movement.id)}
                    onCheckedChange={() => selectMovement(movement.id)}
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

      <MovementsSelection
        selectedMovements={selectedMovements}
        onClearSelection={() => setSelectedMovements([])}
      />
    </div>
  );
}
