import type { LucideIcon } from "lucide-react";

import { ListFilter, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  isEmptyFilterValue,
  replacePickerFilter,
  type FilterShape,
} from "./filter-picker-state";

export interface FilterPickerField<F extends FilterShape> {
  value: F["field"];
  text: string;
  icon: LucideIcon;
  operators: readonly string[];
  operatorsWithoutValue?: readonly string[];
  defaultOperator: string;
  renderValue: (
    pending: F,
    update: (patch: Partial<F>) => void,
  ) => React.ReactNode;
}

interface FilterPickerProps<F extends FilterShape> {
  fields: FilterPickerField<F>[];
  emptyFilter: (field: F["field"]) => F;
  isComplete: (filter: F) => boolean;
  filters: F[];
  onFiltersChange: (filters: F[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

/** One dropdown for fields, with a persistent checkbox submenu for each field's values. */
export function FilterPicker<F extends FilterShape>({
  fields,
  emptyFilter,
  isComplete,
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
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key !== "Tab" || event.defaultPrevented) return;
                    // Radix arrow navigation covers menu items; Tab also reaches embedded controls.
                    event.preventDefault();
                    const controls = Array.from(
                      event.currentTarget.querySelectorAll<HTMLElement>(
                        'button:not([disabled]), input:not([disabled]), [role="menuitemcheckbox"]',
                      ),
                    );
                    const current = controls.indexOf(
                      document.activeElement as HTMLElement,
                    );
                    const next = event.shiftKey
                      ? current <= 0
                        ? controls.length - 1
                        : current - 1
                      : (current + 1) % controls.length;
                    controls[next]?.focus();
                  }}
                >
                  <FilterFieldEditor
                    field={field}
                    emptyFilter={emptyFilter}
                    isComplete={isComplete}
                    filters={filters}
                    onFiltersChange={onFiltersChange}
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

function FilterFieldEditor<F extends FilterShape>({
  field,
  emptyFilter,
  isComplete,
  filters,
  onFiltersChange,
}: Pick<
  FilterPickerProps<F>,
  "emptyFilter" | "isComplete" | "filters" | "onFiltersChange"
> & {
  field: FilterPickerField<F>;
}) {
  const [pending, setPending] = React.useState<F>(() => {
    const existing = [...filters]
      .reverse()
      .find((filter) => filter.field === field.value);
    return {
      ...(existing ?? emptyFilter(field.value)),
      operator: existing?.operator ?? field.defaultOperator,
    };
  });
  const withoutValue = (operator: string | undefined) =>
    operator !== undefined &&
    (field.operatorsWithoutValue?.includes(operator) ?? false);

  const update = (patch: Partial<F>) => {
    const next = { ...pending, ...patch };
    setPending(next);
    const complete = isComplete(next);
    // Operator-only edits stay local until complete. Clearing the last checked value removes the filter.
    if (!complete && !("value" in patch && isEmptyFilterValue(next.value)))
      return;
    const saved = complete
      ? withoutValue(next.operator)
        ? { ...next, value: undefined }
        : next
      : null;
    const nextFilters = replacePickerFilter(filters, field.value, saved);
    if (nextFilters !== filters) onFiltersChange(nextFilters);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-2 py-1.5">
        <span className="min-w-0 truncate text-xs font-medium">
          {field.text}
        </span>
        <Select
          value={pending.operator}
          onValueChange={(operator) => update({ operator } as Partial<F>)}
        >
          <SelectTrigger
            size="sm"
            aria-label={`${field.text} operator`}
            className="h-7 w-auto max-w-40 gap-1.5 border-transparent bg-transparent px-2 text-xs shadow-none hover:bg-muted dark:bg-transparent"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="motion-reduce:animate-none">
            {field.operators.map((operator) => (
              <SelectItem key={operator} value={operator}>
                {operator}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DropdownMenuSeparator />
      {withoutValue(pending.operator) ? (
        <p className="px-2 py-2 text-xs text-muted-foreground">
          No value needed.
        </p>
      ) : (
        field.renderValue(pending, update)
      )}
    </>
  );
}

/** Menu checkbox items retain focus and keep the submenu open for multiple selections. */
export function FilterCheckboxList({
  values,
  options,
  onToggle,
}: {
  values: string[];
  options: { value: string; label: string; marker?: React.ReactNode }[];
  onToggle: (value: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  const visible = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      {options.length > 8 && (
        <div className="px-1 pb-1">
          <Input
            aria-label="Search filter values"
            placeholder="Search values…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape" && event.key !== "Tab")
                event.stopPropagation();
            }}
            className="h-8 text-sm"
          />
        </div>
      )}
      <div className="max-h-64 overflow-y-auto">
        {visible.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            {options.length === 0
              ? "No values available."
              : "No matching values."}
          </p>
        )}
        {visible.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={values.includes(option.value)}
            onCheckedChange={() => onToggle(option.value)}
            onSelect={(event) => event.preventDefault()}
            textValue={option.label}
            className="min-h-11 gap-2 text-sm sm:min-h-8 sm:text-[13px]"
          >
            {option.marker}
            <span className="truncate">{option.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </div>
    </>
  );
}

/** Scalar values are submitted explicitly; dismissing an unfinished input changes nothing. */
export function FilterValueInput({
  pending,
  update,
  defaultOperator,
  type,
  placeholder,
}: {
  pending: FilterShape;
  update: (patch: Record<string, unknown>) => void;
  defaultOperator: string;
  type: "text" | "number";
  placeholder: string;
}) {
  const [text, setText] = React.useState(
    (pending.value as string | number | undefined)?.toString() ?? "",
  );
  const value =
    type === "number"
      ? text.trim() === ""
        ? undefined
        : Number(text)
      : text.trim();
  return (
    <form
      className="flex flex-col items-stretch gap-2 p-1 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isEmptyFilterValue(value))
          update({ operator: pending.operator ?? defaultOperator, value });
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" && event.key !== "Tab")
          event.stopPropagation();
      }}
    >
      <Input
        type={type}
        step={type === "number" ? "any" : undefined}
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="h-8 min-w-0 text-sm"
      />
      <Button type="submit" size="sm" disabled={isEmptyFilterValue(value)}>
        Apply
      </Button>
    </form>
  );
}

/** Date presets are values in the field submenu, not another nested select. */
export function FilterValueSelect({
  pending,
  update,
  defaultOperator,
  options,
}: {
  pending: FilterShape;
  update: (patch: Record<string, unknown>) => void;
  defaultOperator: string;
  options: readonly string[];
}) {
  return (
    <FilterCheckboxList
      values={typeof pending.value === "string" ? [pending.value] : []}
      options={options.map((value) => ({ value, label: value }))}
      onToggle={(value) =>
        update({
          operator: pending.operator ?? defaultOperator,
          value: pending.value === value ? undefined : value,
        })
      }
    />
  );
}
