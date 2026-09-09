import { useFundMovesBulkActions } from "@/components/funds/fund-moves-bulk-actions";
import { SelectionBar } from "@/components/shared/bulk-actions";

interface FundMovesSelectionProps {
  selectedFundMoves: string[];
  onClearSelection: () => void;
}

export function FundMovesSelection({
  selectedFundMoves,
  onClearSelection,
}: FundMovesSelectionProps) {
  const actions = useFundMovesBulkActions(selectedFundMoves, onClearSelection);

  return (
    <SelectionBar
      selectedIds={selectedFundMoves}
      actions={actions}
      entityName="fund move"
      onClearSelection={onClearSelection}
    />
  );
}
