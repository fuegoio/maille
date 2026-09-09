import { useMovementsBulkActions } from "@/components/movements/movements-bulk-actions";
import { SelectionBar } from "@/components/shared/bulk-actions";

interface MovementsSelectionProps {
  selectedMovements: string[];
  onClearSelection: () => void;
}

export function MovementsSelection({
  selectedMovements,
  onClearSelection,
}: MovementsSelectionProps) {
  const actions = useMovementsBulkActions(selectedMovements, onClearSelection);

  return (
    <SelectionBar
      selectedIds={selectedMovements}
      actions={actions}
      entityName="movement"
      onClearSelection={onClearSelection}
    />
  );
}
