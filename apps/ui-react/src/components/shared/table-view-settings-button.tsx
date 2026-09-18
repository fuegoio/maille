import type { ViewConfig } from "@/types/views";

import { transactionViewDescriptor } from "@/components/accounts/transaction-view";
import { fundMoveViewDescriptor } from "@/components/funds/fund-move-view";
import { movementViewDescriptor } from "@/components/movements/movement-view";
import { useViews } from "@/stores/views";

import { ViewSettingsButton } from "./view-settings-button";

export function TableViewSettingsButton({
  kind,
  viewId,
}: {
  kind: "movement" | "transaction" | "fundMove";
  viewId: string;
}) {
  const view = useViews((state) =>
    kind === "movement"
      ? state.getMovementView(viewId)
      : kind === "transaction"
        ? state.getTransactionView(viewId)
        : state.getFundMoveView(viewId),
  );
  const descriptor =
    kind === "movement"
      ? movementViewDescriptor
      : kind === "transaction"
        ? transactionViewDescriptor
        : fundMoveViewDescriptor;
  const onConfigChange = (update: Partial<ViewConfig>) => {
    const state = useViews.getState();
    if (kind === "movement")
      state.setMovementView(viewId, {
        ...state.getMovementView(viewId),
        ...update,
      });
    else if (kind === "transaction")
      state.setTransactionView(viewId, {
        ...state.getTransactionView(viewId),
        ...update,
      });
    else
      state.setFundMoveView(viewId, {
        ...state.getFundMoveView(viewId),
        ...update,
      });
  };
  return (
    <ViewSettingsButton
      descriptor={descriptor}
      config={view}
      onConfigChange={onConfigChange}
    />
  );
}
