import type {
  View,
  ViewConfig as CustomViewConfig,
  ViewResource,
  ViewScope,
} from "@maille/core/views";
import type { LucideIcon } from "lucide-react";

import { deserializeViewScope } from "@maille/core/views";
import { ArrowRightLeft, BookMarked, CreditCard } from "lucide-react";
import * as React from "react";

import type { ViewConfig, ViewDescriptor } from "@/types/views";

import {
  ACTIVITY_VIEW_FIELDS,
  activityViewDescriptor,
} from "@/components/activities/activity-view";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import { ExportMovementsButton } from "@/components/movements/export-movements-button";
import { FilterMovementsButton } from "@/components/movements/filters/filter-movements-button";
import {
  MOVEMENT_VIEW_FIELDS,
  movementViewDescriptor,
} from "@/components/movements/movement-view";
import { ViewSettingsButton } from "@/components/shared/view-settings-button";
import { ExportTransactionsButton } from "@/components/transactions/export-transactions-button";
import { FilterTransactionsButton } from "@/components/transactions/filters/filter-transactions-button";
import {
  TRANSACTION_VIEW_FIELDS,
  transactionViewDescriptor,
} from "@/components/transactions/transaction-view";
import { Switch } from "@/components/ui/switch";
import {
  ActivitiesViewContent,
  MovementsViewContent,
  TransactionsViewContent,
  type ViewContentProps,
} from "@/components/views/custom-view-content";
import {
  scopedTransactionsFilter,
  useScopedActivities,
  useScopedMovements,
} from "@/components/views/view-scope-data";
import { useAccounts } from "@/stores/accounts";

/** Which resources a scope's custom views can display. */
export function scopeResources(scope: ViewScope): ViewResource[] {
  switch (scope.kind) {
    case "page":
      if (scope.page === "movements") return ["movements"];
      return ["activities"];
    case "month":
      return ["activities", "movements"];
    case "account":
      return ["transactions", "movements"];
    case "fund":
      return ["transactions"];
    case "category":
      return ["activities"];
    case "project":
      return ["activities"];
  }
}

/**
 * The resources a scope offers but that are turned off, so they render
 * disabled instead of being hidden: accounts without movements enabled,
 * like their disabled tab.
 */
export function useDisabledResources(scope: ViewScope): ViewResource[] {
  const account = useAccounts((state) =>
    scope.kind === "account"
      ? state.getAccountById(scope.accountId)
      : undefined,
  );
  if (scope.kind === "account" && !account?.movements) {
    return ["movements"];
  }
  return [];
}

/** The default grouping of a new view: months are already one period. */
function defaultGrouping(scope: ViewScope): string {
  return scope.kind === "month" ? "none" : "period";
}

interface ViewActionButtonProps {
  view: View;
  onConfigChange: (config: CustomViewConfig) => void;
  className?: string;
}

/** The standard actions every view resource must provide. */
export interface ViewResourceDefinition {
  /** The resource's name, as shown when creating a view. */
  label: string;
  icon: LucideIcon;
  /** The settings popover's fields, orderings and groupings. */
  descriptor: ViewDescriptor;
  /** The config a new view over this resource starts from. */
  defaultConfig: (scope: ViewScope) => CustomViewConfig;
  /** Renders the view's table. */
  Content: React.ComponentType<ViewContentProps>;
  /** Adds a filter to the view. */
  FilterButton: React.ComponentType<ViewActionButtonProps>;
  /** The view's settings popover button. */
  SettingsButton: React.ComponentType<
    ViewActionButtonProps & { children?: React.ReactNode }
  >;
  /** Exports the view's rows as CSV. */
  ExportButton: React.ComponentType<{ view: View; className?: string }>;
}

/**
 * Shared popover button body: descriptor-driven settings over a custom
 * view's config. Resource-specific options render as children.
 */
function descriptorSettingsButton(
  descriptor: ViewDescriptor,
  props: ViewActionButtonProps & { children?: React.ReactNode },
) {
  const { view, onConfigChange, className, children } = props;
  const config = view.config;
  return (
    <ViewSettingsButton
      descriptor={descriptor}
      config={config}
      onConfigChange={(update: Partial<ViewConfig>) =>
        onConfigChange({ ...config, ...update } as CustomViewConfig)
      }
      className={className}
    >
      {children}
    </ViewSettingsButton>
  );
}

function ActivitiesFilterButton({
  view,
  onConfigChange,
  className,
}: ViewActionButtonProps) {
  if (view.config.resource !== "activities") return null;
  const config = view.config;
  return (
    <FilterActivitiesButton
      filters={config.filters}
      onFiltersChange={(filters) => onConfigChange({ ...config, filters })}
      className={className}
    />
  );
}

function ActivitiesSettingsButton(props: ViewActionButtonProps) {
  const { view, onConfigChange } = props;
  if (view.config.resource !== "activities") return null;
  const config = view.config;
  return descriptorSettingsButton(activityViewDescriptor, {
    ...props,
    children: (
      <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-[13px]">
        <span>Show transactions</span>
        <Switch
          size="sm"
          aria-label="Show transactions"
          checked={config.showTransactions}
          onCheckedChange={(showTransactions) =>
            onConfigChange({ ...config, showTransactions })
          }
        />
      </label>
    ),
  });
}

function ActivitiesExportButton({
  view,
  className,
}: {
  view: View;
  className?: string;
}) {
  const scope = deserializeViewScope(view.scope);
  const activities = useScopedActivities(scope);
  if (view.config.resource !== "activities") return null;
  return (
    <ExportActivitiesButton
      activities={activities}
      filters={view.config.filters}
      className={className}
    />
  );
}

function MovementsFilterButton({
  view,
  onConfigChange,
  className,
}: ViewActionButtonProps) {
  if (view.config.resource !== "movements") return null;
  const config = view.config;
  return (
    <FilterMovementsButton
      filters={config.filters}
      onFiltersChange={(filters) => onConfigChange({ ...config, filters })}
      className={className}
    />
  );
}

function MovementsExportButton({
  view,
  className,
}: {
  view: View;
  className?: string;
}) {
  const scope = deserializeViewScope(view.scope);
  const movements = useScopedMovements(scope);
  if (view.config.resource !== "movements") return null;
  return (
    <ExportMovementsButton
      movements={movements}
      filters={view.config.filters}
      className={className}
    />
  );
}

function TransactionsFilterButton({
  view,
  onConfigChange,
  className,
}: ViewActionButtonProps) {
  if (view.config.resource !== "transactions") return null;
  const config = view.config;
  return (
    <FilterTransactionsButton
      filters={config.filters}
      onFiltersChange={(filters) => onConfigChange({ ...config, filters })}
      className={className}
    />
  );
}

function TransactionsExportButton({
  view,
  className,
}: {
  view: View;
  className?: string;
}) {
  const scope = deserializeViewScope(view.scope);
  const filter = React.useMemo(() => scopedTransactionsFilter(scope), [scope]);
  if (view.config.resource !== "transactions") return null;
  return (
    <ExportTransactionsButton
      filter={filter}
      filters={view.config.filters}
      className={className}
    />
  );
}

/**
 * Every view resource, with all its standard actions. The mapped type
 * forces a new ViewResource to grow this registry: adding a resource
 * without deciding its content, filter, settings and export is a type
 * error, not an oversight.
 */
export const VIEW_RESOURCES: Record<ViewResource, ViewResourceDefinition> = {
  activities: {
    label: "Activities",
    icon: BookMarked,
    descriptor: activityViewDescriptor,
    defaultConfig: (scope) => ({
      resource: "activities",
      fields: [...ACTIVITY_VIEW_FIELDS],
      ordering: { field: "date", direction: "desc" },
      grouping: defaultGrouping(scope),
      showTransactions: false,
      filters: [],
    }),
    Content: ActivitiesViewContent,
    FilterButton: ActivitiesFilterButton,
    SettingsButton: ActivitiesSettingsButton,
    ExportButton: ActivitiesExportButton,
  },
  movements: {
    label: "Movements",
    icon: CreditCard,
    descriptor: movementViewDescriptor,
    defaultConfig: (scope) => ({
      resource: "movements",
      fields: [...MOVEMENT_VIEW_FIELDS],
      ordering: { field: "date", direction: "desc" },
      grouping: defaultGrouping(scope),
      filters: [],
    }),
    Content: MovementsViewContent,
    FilterButton: MovementsFilterButton,
    SettingsButton: (props) =>
      descriptorSettingsButton(movementViewDescriptor, props),
    ExportButton: MovementsExportButton,
  },
  transactions: {
    label: "Transactions",
    icon: ArrowRightLeft,
    descriptor: transactionViewDescriptor,
    defaultConfig: (scope) => ({
      resource: "transactions",
      fields: [...TRANSACTION_VIEW_FIELDS],
      ordering: { field: "date", direction: "desc" },
      grouping: defaultGrouping(scope),
      filters: [],
    }),
    Content: TransactionsViewContent,
    FilterButton: TransactionsFilterButton,
    SettingsButton: (props) =>
      descriptorSettingsButton(transactionViewDescriptor, props),
    ExportButton: TransactionsExportButton,
  },
};

/** The definition of a view's resource, resolved from its config. */
export function viewResourceDefinition(view: View): ViewResourceDefinition {
  return VIEW_RESOURCES[view.config.resource];
}
