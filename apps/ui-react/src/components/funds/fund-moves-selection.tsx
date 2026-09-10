import { useFundMovesEntityActions } from "@/components/funds/fund-moves-actions";
import { SelectionBar } from "@/components/shared/entity-actions";

interface FundMovesSelectionProps {
  selectedFundMoves: string[];
  onClearSelection: () => void;
}

export function FundMovesSelection({
  selectedFundMoves,
  onClearSelection,
}: FundMovesSelectionProps) {
  const actions = useFundMovesEntityActions(
    selectedFundMoves,
    onClearSelection,
  );

  return (
    <SelectionBar
      selectedIds={selectedFundMoves}
      actions={actions}
      entityName="fund move"
      onClearSelection={onClearSelection}
    />
  );
}
