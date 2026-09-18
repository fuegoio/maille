import * as React from "react";

import type { ViewConfig } from "@/types/views";

import { ViewSettingsButton } from "@/components/shared/view-settings-button";
import { Switch } from "@/components/ui/switch";
import { useViews } from "@/stores/views";

import { activityViewDescriptor } from "./activity-view";

interface ActivityViewSettingsButtonProps {
  viewId: string;
  className?: string;
  hideProject?: boolean;
}

/**
 * The activities view settings: the generic fields, ordering and grouping
 * sections, plus the activity's own "show transactions" option.
 */
export function ActivityViewSettingsButton({
  viewId,
  className,
  hideProject = false,
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
      descriptor={
        hideProject
          ? {
              ...activityViewDescriptor,
              fields: activityViewDescriptor.fields.filter(
                (field) => field.value !== "project",
              ),
            }
          : activityViewDescriptor
      }
      config={activityView}
      onConfigChange={handleConfigChange}
      className={className}
    >
      <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-[13px]">
        <span>Show transactions</span>
        <Switch
          size="sm"
          aria-label="Show transactions"
          checked={activityView.showTransactions}
          onCheckedChange={(showTransactions) =>
            setActivityView(viewId, { ...activityView, showTransactions })
          }
        />
      </label>
    </ViewSettingsButton>
  );
}
