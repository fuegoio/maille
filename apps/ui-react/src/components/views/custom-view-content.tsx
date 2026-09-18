import type { View, ViewConfig as CustomViewConfig } from "@maille/core/views";

import { deserializeViewScope } from "@maille/core/views";
import * as React from "react";

import { ActivitiesTable } from "@/components/activities/activities-table";
import { MovementsTable } from "@/components/movements/movements-table";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import {
  scopedTransactionsFilter,
  useScopedActivities,
  useScopedMovements,
} from "@/components/views/view-scope-data";

export interface ViewContentProps {
  view: View;
  onConfigChange: (config: CustomViewConfig) => void;
}

/** The view's own scope, as stored on the record. */
function useViewScope(view: View) {
  return React.useMemo(() => deserializeViewScope(view.scope), [view.scope]);
}

/** A custom view's activities table, scoped by the view's scope. */
export function ActivitiesViewContent({
  view,
  onConfigChange,
}: ViewContentProps) {
  const scope = useViewScope(view);
  const activities = useScopedActivities(scope);
  if (view.config.resource !== "activities") return null;
  return (
    <ActivitiesTable
      viewId={`custom-${view.id}`}
      activities={activities}
      config={view.config}
      onConfigChange={onConfigChange}
    />
  );
}

/** A custom view's movements table, scoped by the view's scope. */
export function MovementsViewContent({
  view,
  onConfigChange,
}: ViewContentProps) {
  const scope = useViewScope(view);
  const movements = useScopedMovements(scope);
  if (view.config.resource !== "movements") return null;
  return (
    <MovementsTable
      viewId={`custom-${view.id}`}
      movements={movements}
      config={view.config}
      onConfigChange={onConfigChange}
    />
  );
}

/** A custom view's transactions table, scoped by the view's scope. */
export function TransactionsViewContent({
  view,
  onConfigChange,
}: ViewContentProps) {
  const scope = useViewScope(view);
  const filter = React.useMemo(() => scopedTransactionsFilter(scope), [scope]);
  if (view.config.resource !== "transactions") return null;
  return (
    <TransactionsTable
      viewId={`custom-${view.id}`}
      filter={filter}
      config={view.config}
      onConfigChange={onConfigChange}
    />
  );
}
