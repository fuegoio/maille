import { useMovementsEntityActions } from "@/components/movements/movements-actions";
import { SelectionBar } from "@/components/shared/entity-actions";

interface MovementsSelectionProps {
  selectedMovements: string[];
  onClearSelection: () => void;
}

export function MovementsSelection({
  selectedMovements,
  onClearSelection,
}: MovementsSelectionProps) {
  const actions = useMovementsEntityActions(
    selectedMovements,
    onClearSelection,
  );

  return (
    <SelectionBar
      selectedIds={selectedMovements}
      actions={actions}
      entityName="movement"
      onClearSelection={onClearSelection}
    />
  );
}
