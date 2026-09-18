import type { ViewConfig } from "@/types/views";

import { movementViewDescriptor } from "@/components/movements/movement-view";
import { transactionViewDescriptor } from "@/components/transactions/transaction-view";
import { useViews } from "@/stores/views";

import { ViewSettingsButton } from "./view-settings-button";

export function TableViewSettingsButton({
  kind,
  viewId,
}: {
  kind: "movement" | "transaction";
  viewId: string;
}) {
  const view = useViews((state) =>
    kind === "movement"
      ? state.getMovementView(viewId)
      : state.getTransactionView(viewId),
  );
  const descriptor =
    kind === "movement" ? movementViewDescriptor : transactionViewDescriptor;
  const onConfigChange = (update: Partial<ViewConfig>) => {
    const state = useViews.getState();
    if (kind === "movement")
      state.setMovementView(viewId, {
        ...state.getMovementView(viewId),
        ...update,
      });
    else
      state.setTransactionView(viewId, {
        ...state.getTransactionView(viewId),
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
