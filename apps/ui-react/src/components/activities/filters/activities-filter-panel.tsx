import { Button } from "@/components/ui/button";
import { useViews } from "@/stores/views";

import { ActivityFilter } from "./activity-filter";
import { FilterActivitiesButton } from "./filter-activities-button";

interface ActivitiesFilterPanelProps {
  viewId: string;
}

/**
 * The filter side panel: the view's filter builder, vertical. Edits the
 * same view filters as the inline chips above the table — both stay in
 * sync, the panel gives the filters a permanent home.
 */
export function ActivitiesFilterPanel({ viewId }: ActivitiesFilterPanelProps) {
  const activityView = useViews((state) => state.getActivityView(viewId));
  const setActivityView = useViews((state) => state.setActivityView);

  return (
    <div className="flex flex-col gap-2 p-4">
      {activityView.filters.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No filter. Add one to narrow the table.
        </div>
      )}

      {activityView.filters.map((filter, index) => (
        <div key={index} className="flex items-center gap-1">
          <ActivityFilter
            modelValue={filter}
            onUpdateModelValue={(newFilter) => {
              setActivityView(viewId, {
                ...activityView,
                filters: activityView.filters.map((f, i) =>
                  i === index ? newFilter : f,
                ),
              });
            }}
            onDelete={() => {
              setActivityView(viewId, {
                ...activityView,
                filters: activityView.filters.filter((_, i) => i !== index),
              });
            }}
          />
        </div>
      ))}

      <div className="mt-1 flex items-center gap-2">
        <FilterActivitiesButton viewId={viewId} />
        {activityView.filters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="font-normal text-muted-foreground"
            onClick={() =>
              setActivityView(viewId, { ...activityView, filters: [] })
            }
          >
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
