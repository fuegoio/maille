import type { View, ViewScope } from "@maille/core/views";

import { serializeViewScope } from "@maille/core/views";
import * as React from "react";

import { TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { useCustomViews } from "@/stores/customViews";

import { AddViewDialog } from "./add-view-dialog";
import { useViewMutations } from "./view-mutations";
import { viewResourceDefinition } from "./view-resources";

/** The custom views attached to a scope, in creation order. */
export function useScopeViews(scope: ViewScope): View[] {
  const views = useCustomViews((state) => state.views);
  const key = serializeViewScope(scope);
  return React.useMemo(
    () => views.filter((view) => view.scope === key),
    [views, key],
  );
}

/**
 * The selected custom view of a scope, when the page's selected tab is
 * one of its custom views rather than a fixed tab.
 */
export function useSelectedView(
  scope: ViewScope,
  selectedTab: string | undefined,
): View | null {
  const views = useScopeViews(scope);
  if (selectedTab === undefined) return null;
  return views.find((view) => view.id === selectedTab) ?? null;
}

/**
 * A scope's custom view tabs: one trigger per view, then the add button.
 * Rendered inside the page's TabsList, after its fixed tabs.
 */
export function CustomViewTabs({
  scope,
  onSelect,
}: {
  scope: ViewScope;
  onSelect: (viewId: string) => void;
}) {
  const views = useScopeViews(scope);

  return (
    <>
      {views.map((view) => {
        const Icon = viewResourceDefinition(view).icon;
        return (
          <TabsTrigger key={view.id} value={view.id}>
            <Icon />
            {view.name}
          </TabsTrigger>
        );
      })}
      <AddViewDialog scope={scope} onCreated={onSelect} />
    </>
  );
}

/** The TabsContent of every custom view of a scope. */
export function CustomViewTabsContent({ scope }: { scope: ViewScope }) {
  const views = useScopeViews(scope);
  const { updateViewConfig } = useViewMutations();

  return (
    <>
      {views.map((view) => {
        const Content = viewResourceDefinition(view).Content;
        return (
          <TabsContent key={view.id} value={view.id} className="flex h-full">
            <Content
              view={view}
              onConfigChange={(config) => updateViewConfig(view, config)}
            />
          </TabsContent>
        );
      })}
    </>
  );
}
