import * as React from "react";

import type { ViewConfig } from "@/types/views";

import { ViewSettingsButton } from "@/components/shared/view-settings-button";
import { Switch } from "@/components/ui/switch";
import { useViews } from "@/stores/views";

import { activityViewDescriptor } from "./activity-view";

interface ActivityViewSettingsButtonProps {
  viewId: string;
  className?: string;
}

/**
 * The activities view settings: the generic fields, ordering and grouping
 * sections, plus the activity's own "show transactions" option.
 */
export function ActivityViewSettingsButton({
  viewId,
  className,
}: ActivityViewSettingsButtonProps) {
  const activityView = useViews((state) => state.getActivityView(viewId));
  const setActivityView = useViews((state) => state.setActivityView);

  const handleConfigChange = React.useCallback(
    (update: Partial<ViewConfig>) => {
      setActivityView(viewId, { ...activityView, ...update });
    },
    [activityView, setActivityView, viewId],
  );

  return (
    <ViewSettingsButton
      descriptor={activityViewDescriptor}
      config={activityView}
      onConfigChange={handleConfigChange}
      className={className}
    >
      <div className="flex h-7 items-center justify-between rounded-sm pr-1 pl-1 text-sm hover:bg-muted/50">
        <span>Show transactions</span>
        <Switch
          size="sm"
          aria-label="Show transactions"
          checked={activityView.showTransactions}
          onCheckedChange={(showTransactions) =>
            setActivityView(viewId, { ...activityView, showTransactions })
          }
        />
      </div>
    </ViewSettingsButton>
  );
}
