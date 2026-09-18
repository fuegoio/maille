import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  SlidersHorizontal,
} from "lucide-react";
import * as React from "react";

import type { ViewConfig, ViewDescriptor } from "@/types/views";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ViewSettingsButtonProps {
  descriptor: ViewDescriptor;
  config: ViewConfig;
  onConfigChange: (update: Partial<ViewConfig>) => void;
  /** Resource-specific options, rendered between the separators. */
  children?: React.ReactNode;
  className?: string;
}

const selectClassName =
  "w-full min-w-0 border-border/60 bg-muted/40 px-2 text-xs hover:bg-muted dark:bg-muted/40 dark:hover:bg-muted";

/**
 * The generic view settings popover: picks the ordering and grouping,
 * toggles the row fields from a resource's view descriptor. Anything
 * resource-specific (e.g. showing an activity's transactions) is passed
 * as children.
 */
export function ViewSettingsButton({
  descriptor,
  config,
  onConfigChange,
  children,
  className,
}: ViewSettingsButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="View settings"
        >
          <SlidersHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-label="View settings"
        onKeyDown={(event) => {
          // Keep table shortcuts from intercepting the popover's controls.
          if (event.key !== "Escape") event.stopPropagation();
        }}
        className="max-h-(--radix-popover-content-available-height) w-80 max-w-[calc(100vw-1.5rem)] gap-0 overflow-y-auto p-0 motion-reduce:animate-none motion-reduce:[&_*]:transition-none"
      >
        <section
          aria-label="Grouping and ordering"
          className="grid grid-cols-[minmax(0,1fr)_9.5rem] items-center gap-x-3 gap-y-2 px-3 py-3 text-[13px]"
        >
          <span>Grouping</span>
          <Select
            value={config.grouping}
            onValueChange={(grouping) => onConfigChange({ grouping })}
          >
            <SelectTrigger
              size="sm"
              aria-label="Grouping"
              className={selectClassName}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="motion-reduce:animate-none">
              {descriptor.groupings.map((grouping) => (
                <SelectItem key={grouping.value} value={grouping.value}>
                  {grouping.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span>Ordering</span>
          <div className="flex min-w-0 items-center gap-1">
            <Select
              value={config.ordering.field}
              onValueChange={(field) =>
                onConfigChange({
                  ordering: { ...config.ordering, field },
                })
              }
            >
              <SelectTrigger
                size="sm"
                aria-label="Ordering"
                className={selectClassName}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="motion-reduce:animate-none">
                {descriptor.orderings.map((ordering) => (
                  <SelectItem key={ordering.value} value={ordering.value}>
                    {ordering.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                config.ordering.direction === "asc" ? "Ascending" : "Descending"
              }
              title={
                config.ordering.direction === "asc"
                  ? "Ascending — switch to descending"
                  : "Descending — switch to ascending"
              }
              onClick={() =>
                onConfigChange({
                  ordering: {
                    ...config.ordering,
                    direction:
                      config.ordering.direction === "asc" ? "desc" : "asc",
                  },
                })
              }
            >
              {config.ordering.direction === "asc" ? (
                <ArrowUpNarrowWide />
              ) : (
                <ArrowDownWideNarrow />
              )}
            </Button>
          </div>
        </section>

        {children && (
          <>
            <Separator />
            <div className="px-3 py-2">{children}</div>
          </>
        )}

        <Separator />

        <section className="flex flex-col gap-2 px-3 py-3">
          <h3 className="text-xs font-medium text-muted-foreground">Fields</h3>
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            spacing={1}
            className="w-full flex-wrap justify-start gap-1"
            aria-label="Visible fields"
            value={descriptor.fields
              .filter(
                (field) => field.locked || config.fields.includes(field.value),
              )
              .map((field) => field.value)}
            onValueChange={(fields) =>
              onConfigChange({
                fields: descriptor.fields
                  .filter(
                    (field) => field.locked || fields.includes(field.value),
                  )
                  .map((field) => field.value),
              })
            }
          >
            {descriptor.fields.map((field) => (
              <ToggleGroupItem
                key={field.value}
                value={field.value}
                aria-label={`Field: ${field.text}`}
                title={
                  field.locked ? `${field.text} is always visible` : field.text
                }
                disabled={field.locked}
                className="px-2 text-xs font-normal text-muted-foreground disabled:opacity-60 data-[state=on]:border-foreground/25 data-[state=on]:bg-muted data-[state=on]:text-foreground"
              >
                {field.text}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>
      </PopoverContent>
    </Popover>
  );
}
