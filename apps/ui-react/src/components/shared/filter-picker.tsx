import { ListFilter, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  FilterFieldEditor,
  handleFilterEditorKeyDown,
  type FilterFieldDefinition,
} from "./filter-field-editor";
import { replacePickerFilter, type FilterShape } from "./filter-picker-state";

interface FilterPickerProps<F extends FilterShape> {
  fields: FilterFieldDefinition<F>[];
  filters: F[];
  onFiltersChange: (filters: F[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

/** One dropdown for fields, with a persistent checkbox submenu for each field's values. */
export function FilterPicker<F extends FilterShape>({
  fields,
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterPickerProps<F>) {
  const [activeField, setActiveField] = React.useState<string | null>(null);
  const [alignOffset, setAlignOffset] = React.useState(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setActiveField(null);
        if (open) {
          // Reserve room for both panels on narrow screens.
          const right =
            triggerRef.current?.getBoundingClientRect().right ??
            window.innerWidth - 8;
          setAlignOffset(
            window.matchMedia("(max-width: 639px)").matches
              ? right - window.innerWidth + 8
              : 0,
          );
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              ref={triggerRef}
              variant="ghost"
              size={variant === "default" ? "icon" : "icon-sm"}
              className={cn("relative", className)}
              aria-label={variant === "default" ? "Filter" : "Add a filter"}
            >
              {variant === "default" ? <ListFilter /> : <Plus />}
              {variant === "default" && filters.length > 0 && (
                <span
                  aria-hidden
                  className="absolute top-0 right-0 grid min-w-3.5 place-content-center rounded-full bg-primary px-0.5 text-[10px] leading-3.5 font-medium text-primary-foreground"
                >
                  {filters.length > 9 ? "9+" : filters.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {filters.length > 0 ? `Filter · ${filters.length} active` : "Filter"}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        alignOffset={alignOffset}
        sideOffset={8}
        collisionPadding={8}
        aria-label="Filter by"
        className="w-36 max-w-[calc(100vw-1rem)] motion-reduce:animate-none sm:w-48"
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
        {fields.map((field) => {
          const Icon = field.icon;
          const active = filters.some((filter) => filter.field === field.value);
          return (
            <DropdownMenuSub
              key={field.value}
              open={activeField === field.value}
              onOpenChange={(open) =>
                setActiveField((current) =>
                  open ? field.value : current === field.value ? null : current,
                )
              }
            >
              <DropdownMenuSubTrigger className="min-h-11 gap-2 text-sm sm:min-h-8 sm:text-[13px]">
                <Icon className="size-4 text-muted-foreground" />
                <span className="truncate">{field.text}</span>
                {active && (
                  <span
                    className="size-1.5 rounded-full bg-primary"
                    aria-label="Active filter"
                  />
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent
                  sideOffset={4}
                  collisionPadding={8}
                  aria-label={`${field.text} filter`}
                  // Operator selects use their own portal; field switching is controlled above.
                  onFocusOutside={(event) => event.preventDefault()}
                  className="max-h-(--radix-dropdown-menu-content-available-height) w-[calc(100vw-10rem)] max-w-64 overflow-y-auto motion-reduce:animate-none sm:w-64 motion-reduce:[&_*]:transition-none"
                  onKeyDown={handleFilterEditorKeyDown}
                >
                  <FilterFieldEditor
                    field={field}
                    filter={[...filters]
                      .reverse()
                      .find((filter) => filter.field === field.value)}
                    onChange={(next) => {
                      const updated = replacePickerFilter(
                        filters,
                        field.value,
                        next,
                      );
                      if (updated !== filters) onFiltersChange(updated);
                    }}
                  />
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
