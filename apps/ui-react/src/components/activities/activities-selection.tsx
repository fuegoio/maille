import { useActivitiesBulkActions } from "@/components/activities/activities-bulk-actions";
import { SelectionBar } from "@/components/shared/bulk-actions";

interface ActivitiesSelectionProps {
  selectedActivities: string[];
  onClearSelection: () => void;
}

export function ActivitiesSelection({
  selectedActivities,
  onClearSelection,
}: ActivitiesSelectionProps) {
  const actions = useActivitiesBulkActions(
    selectedActivities,
    onClearSelection,
  );

  return (
    <SelectionBar
      selectedIds={selectedActivities}
      actions={actions}
      entityName="activity"
      onClearSelection={onClearSelection}
    />
  );
}
