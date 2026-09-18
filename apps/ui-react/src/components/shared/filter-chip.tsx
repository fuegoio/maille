import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { FilterShape } from "./filter-picker-state";

import {
  FilterFieldEditor,
  FilterValueSummary,
  handleFilterEditorKeyDown,
  type FilterFieldDefinition,
} from "./filter-field-editor";

export function FilterChip<F extends FilterShape>({
  field,
  filter,
  onChange,
  onDelete,
}: {
  field: FilterFieldDefinition<F>;
  filter: F;
  onChange: (filter: F) => void;
  onDelete: () => void;
}) {
  const Icon = field.icon;
  const withoutValue =
    field.operatorsWithoutValue?.includes(filter.operator ?? "") ?? false;
  return (
    <div className="flex h-6 w-fit max-w-full items-center rounded border border-input">
      <span className="flex h-full shrink-0 items-center gap-1 rounded-l border-r border-input bg-input/30 px-2 text-xs">
        <Icon className="size-3" />
        {field.text}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            aria-label={"Edit " + field.text.toLowerCase() + " filter"}
            className="h-full min-w-0 gap-0 rounded-none px-0 text-xs font-normal"
          >
            <span className="shrink-0 px-2 text-muted-foreground">
              {filter.operator ?? "Choose operator"}
            </span>
            {!withoutValue && (
              <span className="flex h-full min-w-0 items-center gap-1.5 border-l border-input px-2">
                <FilterValueSummary field={field} value={filter.value} />
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          collisionPadding={8}
          aria-label={field.text + " filter"}
          className="w-48 max-w-[calc(100vw-1rem)] motion-reduce:animate-none motion-reduce:[&_*]:transition-none"
          onKeyDown={handleFilterEditorKeyDown}
        >
          <FilterFieldEditor
            field={field}
            filter={filter}
            onChange={(next) => (next === null ? onDelete() : onChange(next))}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        onClick={onDelete}
        aria-label="Delete filter"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 rounded-none rounded-r border-l border-input bg-input/30 hover:bg-input/50"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
