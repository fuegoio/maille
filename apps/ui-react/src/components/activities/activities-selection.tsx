import { useActivitiesEntityActions } from "@/components/activities/activities-actions";
import { SelectionBar } from "@/components/shared/entity-actions";

interface ActivitiesSelectionProps {
  selectedActivities: string[];
  onClearSelection: () => void;
}

export function ActivitiesSelection({
  selectedActivities,
  onClearSelection,
}: ActivitiesSelectionProps) {
  const actions = useActivitiesEntityActions(
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
