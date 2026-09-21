import type { ViewScope } from "@maille/core/views";
import type { LucideIcon } from "lucide-react";

import { Plus } from "lucide-react";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { AddViewDialog } from "./add-view-dialog";
import { viewResourceDefinition } from "./view-resources";
import { useScopeViews } from "./view-tabs";

const CREATE_VALUE = "create-a-view";

/**
 * The mobile shape of a page's view tabs: a select holding the built-in
 * views, the scope's custom views, and the create entry — which opens
 * the same AddViewDialog as the tabs' add button.
 */
export function ViewSelect({
  scope,
  value,
  onSelect,
  builtIn,
  className,
}: {
  scope: ViewScope;
  value: string;
  onSelect: (value: string) => void;
  /** The page's fixed tabs, in display order. */
  builtIn: {
    value: string;
    label: string;
    icon?: LucideIcon;
    disabled?: boolean;
  }[];
  className?: string;
}) {
  const views = useScopeViews(scope);
  const createRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next === CREATE_VALUE) {
            createRef.current?.click();
            return;
          }
          onSelect(next);
        }}
      >
        <SelectTrigger
          aria-label="Views"
          size="sm"
          className="max-w-56 border-transparent bg-transparent text-xs font-medium text-muted-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" aria-label="Views">
          {builtIn.map((tab) => (
            <SelectItem
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className="text-xs"
            >
              {tab.icon && <tab.icon className="size-3.5" />}
              {tab.label}
            </SelectItem>
          ))}
          {views.length > 0 && <SelectSeparator />}
          {views.map((view) => {
            const Icon = viewResourceDefinition(view).icon;
            return (
              <SelectItem key={view.id} value={view.id} className="text-xs">
                <Icon className="size-3.5" />
                {view.name}
              </SelectItem>
            );
          })}
          <SelectSeparator />
          <SelectItem value={CREATE_VALUE} className="text-xs">
            <Plus className="size-3.5" />
            Create a view
          </SelectItem>
        </SelectContent>
      </Select>
      <AddViewDialog scope={scope} onCreated={onSelect}>
        <button
          ref={createRef}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
      </AddViewDialog>
    </div>
  );
}
