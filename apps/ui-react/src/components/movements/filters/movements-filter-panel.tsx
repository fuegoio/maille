import { Button } from "@/components/ui/button";
import { useViews } from "@/stores/views";

import { FilterMovementsButton } from "./filter-movements-button";
import { MovementFilter } from "./movement-filter";

interface MovementsFilterPanelProps {
  viewId: string;
}

/**
 * The filter side panel: the view's filter builder, vertical. Edits the
 * same view filters as the inline chips above the table.
 */
export function MovementsFilterPanel({ viewId }: MovementsFilterPanelProps) {
  const movementView = useViews((state) => state.getMovementView(viewId));
  const setMovementView = useViews((state) => state.setMovementView);

  return (
    <div className="flex flex-col gap-2 p-4">
      {movementView.filters.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No filter. Add one to narrow the table.
        </div>
      )}

      {movementView.filters.map((filter, index) => (
        <div key={index} className="flex items-center gap-1">
          <MovementFilter
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              setMovementView(viewId, {
                ...movementView,
                filters: movementView.filters.map((f, i) =>
                  i === index ? newFilter : f,
                ),
              });
            }}
            onDelete={() => {
              setMovementView(viewId, {
                ...movementView,
                filters: movementView.filters.filter((_, i) => i !== index),
              });
            }}
          />
        </div>
      ))}

      <div className="mt-1 flex items-center gap-2">
        <FilterMovementsButton viewId={viewId} />
        {movementView.filters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="font-normal text-muted-foreground"
            onClick={() =>
              setMovementView(viewId, { ...movementView, filters: [] })
            }
          >
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
