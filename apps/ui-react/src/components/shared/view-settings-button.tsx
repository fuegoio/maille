import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  SlidersHorizontal,
} from "lucide-react";
import * as React from "react";

import type { ViewConfig, ViewDescriptor } from "@/types/views";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ViewSettingsButtonProps {
  descriptor: ViewDescriptor;
  config: ViewConfig;
  onConfigChange: (update: Partial<ViewConfig>) => void;
  /** Resource-specific options, rendered above the shared sections. */
  children?: React.ReactNode;
  className?: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <header className="text-xs font-medium text-muted-foreground">
      {children}
    </header>
  );
}

/**
 * The generic view settings popover: toggles the row fields, picks the
 * ordering and the grouping from a resource's view descriptor. Anything
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
  const toggleField = (field: string, visible: boolean) => {
    // Rebuilt in descriptor order so the display order stays canonical.
    onConfigChange({
      fields: descriptor.fields
        .map((option) => option.value)
        .filter((value) =>
          value === field ? visible : config.fields.includes(value),
        ),
    });
  };

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
      <PopoverContent align="end" className="w-60 gap-4 p-3">
        {children}

        <section className="flex flex-col gap-1">
          <SectionTitle>Fields</SectionTitle>
          {descriptor.fields.map((field) => (
            <label
              key={field.value}
              className="flex h-7 items-center rounded-sm pr-1 pl-1 text-sm hover:bg-muted/50"
            >
              <Checkbox
                checked={config.fields.includes(field.value)}
                disabled={field.locked}
                onCheckedChange={(checked) =>
                  toggleField(field.value, checked === true)
                }
                className="mr-2"
              />
              {field.text}
            </label>
          ))}
        </section>

        <section className="flex flex-col gap-1.5">
          <SectionTitle>Ordering</SectionTitle>
          <div className="flex items-center gap-1.5">
            <Select
              value={config.ordering.field}
              onValueChange={(field) =>
                onConfigChange({
                  ordering: { ...config.ordering, field },
                })
              }
            >
              <SelectTrigger size="sm" className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {descriptor.orderings.map((ordering) => (
                  <SelectItem key={ordering.value} value={ordering.value}>
                    {ordering.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={
                config.ordering.direction === "asc" ? "Ascending" : "Descending"
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

        <section className="flex flex-col gap-1.5">
          <SectionTitle>Grouping</SectionTitle>
          <Select
            value={config.grouping}
            onValueChange={(grouping) => onConfigChange({ grouping })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {descriptor.groupings.map((grouping) => (
                <SelectItem key={grouping.value} value={grouping.value}>
                  {grouping.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      </PopoverContent>
    </Popover>
  );
}
