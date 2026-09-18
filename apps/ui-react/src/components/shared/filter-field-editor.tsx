import type { LucideIcon } from "lucide-react";

import { ArrowLeft, CheckIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { CheckboxIndicator } from "@/components/ui/checkbox";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import {
  filterSubmenuOffset,
  isEmptyFilterValue,
  resolveFilterUpdate,
  toggleFilterValue,
  type FilterShape,
} from "./filter-picker-state";

export interface FilterOption {
  value: string;
  label: string;
  marker?: React.ReactNode;
}

export interface FilterFieldDefinition<F extends FilterShape> {
  value: F["field"];
  text: string;
  icon: LucideIcon;
  operators: readonly string[];
  operatorsWithoutValue?: readonly string[];
  input:
    | { type: "text" }
    | { type: "number" }
    | { type: "single"; options: FilterOption[] }
    | { type: "multiple"; options: FilterOption[]; pluralLabel: string };
}

/** Radix arrows navigate menu items; Tab also reaches the embedded form controls. */
export function handleFilterEditorKeyDown(
  event: React.KeyboardEvent<HTMLDivElement>,
) {
  event.stopPropagation();
  if (event.key !== "Tab" || event.defaultPrevented) return;
  event.preventDefault();
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  );
  const current = controls.indexOf(document.activeElement as HTMLElement);
  const next = event.shiftKey
    ? current <= 0
      ? controls.length - 1
      : current - 1
    : (current + 1) % controls.length;
  controls[next]?.focus();
}

function handleInputKeyDown(event: React.KeyboardEvent) {
  if (event.key !== "Escape" && event.key !== "Tab") event.stopPropagation();
}

/** Both entry points use operators as submenus, with values one level deeper. */
export function FilterFieldEditor<F extends FilterShape>({
  field,
  filter,
  onChange,
}: {
  field: FilterFieldDefinition<F>;
  filter?: F;
  onChange: (filter: F | null) => void;
}) {
  const [activeOperator, setActiveOperator] = React.useState<string | null>(
    null,
  );
  return (
    <>
      <DropdownMenuLabel>{field.text}</DropdownMenuLabel>
      {field.operators.map((operator) => {
        const selected = filter?.operator === operator;
        if (field.operatorsWithoutValue?.includes(operator)) {
          return (
            <DropdownMenuItem
              key={operator}
              className="min-h-11 gap-2 text-sm sm:min-h-8 sm:text-[13px]"
              onSelect={() =>
                onChange({
                  ...filter,
                  field: field.value,
                  operator,
                  value: undefined,
                } as F)
              }
            >
              <span className="flex-1">{operator}</span>
              {selected && (
                <CheckIcon className="size-4" aria-label="Selected operator" />
              )}
            </DropdownMenuItem>
          );
        }
        return (
          <FilterOperatorSubmenu
            key={operator}
            field={field}
            filter={filter}
            operator={operator}
            open={activeOperator === operator}
            onOpenChange={(open) =>
              setActiveOperator((current) =>
                open ? operator : current === operator ? null : current,
              )
            }
            onChange={onChange}
          />
        );
      })}
    </>
  );
}

function FilterOperatorSubmenu<F extends FilterShape>({
  field,
  filter,
  operator,
  open,
  onOpenChange,
  onChange,
}: {
  field: FilterFieldDefinition<F>;
  filter?: F;
  operator: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (filter: F | null) => void;
}) {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [sideOffset, setSideOffset] = React.useState(4);
  const overlapping = sideOffset !== 4;
  return (
    <DropdownMenuSub
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && triggerRef.current) {
          setSideOffset(
            filterSubmenuOffset(
              triggerRef.current.getBoundingClientRect(),
              window.innerWidth,
            ),
          );
        }
        onOpenChange(nextOpen);
      }}
    >
      <DropdownMenuSubTrigger
        ref={triggerRef}
        className="min-h-11 gap-2 text-sm sm:min-h-8 sm:text-[13px]"
      >
        <span className="min-w-0 flex-1 truncate">{operator}</span>
        {filter?.operator === operator && (
          <CheckIcon className="size-4" aria-label="Selected operator" />
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          sideOffset={sideOffset}
          collisionPadding={8}
          aria-label={field.text + " " + operator + " values"}
          className="max-h-(--radix-dropdown-menu-content-available-height) w-64 max-w-[calc(100vw-1rem)] overflow-y-auto motion-reduce:animate-none motion-reduce:[&_*]:transition-none"
          onFocusOutside={(event) => event.preventDefault()}
          onKeyDown={handleFilterEditorKeyDown}
        >
          {overlapping && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onOpenChange(false);
                triggerRef.current?.focus();
              }}
              className="min-h-11 gap-2 text-sm"
            >
              <ArrowLeft className="size-4" />
              Back to operators
            </DropdownMenuItem>
          )}
          <DropdownMenuLabel>
            {field.text} · {operator}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <FilterOperatorValues
            field={field}
            filter={filter}
            operator={operator}
            onChange={onChange}
          />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function FilterOperatorValues<F extends FilterShape>({
  field,
  filter,
  operator,
  onChange,
}: {
  field: FilterFieldDefinition<F>;
  filter?: F;
  operator: string;
  onChange: (filter: F | null) => void;
}) {
  const [pending, setPending] = React.useState<F>(
    () => ({ ...filter, field: field.value, operator }) as F,
  );
  const update = (value: unknown) => {
    const result = resolveFilterUpdate(pending, { value } as Partial<F>);
    setPending(result.pending);
    if (result.saved !== undefined) onChange(result.saved);
  };
  const input = field.input;
  if (input.type === "text" || input.type === "number") {
    return (
      <FilterValueInput
        type={input.type}
        value={pending.value}
        label={field.text}
        onChange={update}
      />
    );
  }
  return (
    <>
      <FilterChoiceList input={input} value={pending.value} onChange={update} />
      {filter &&
        filter.operator !== operator &&
        !isEmptyFilterValue(pending.value) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => update(pending.value)}
              className="min-h-11 text-sm sm:min-h-8 sm:text-[13px]"
            >
              Keep current values
            </DropdownMenuItem>
          </>
        )}
    </>
  );
}

function FilterChoiceList({
  input,
  value,
  onChange,
}: {
  input: Extract<
    FilterFieldDefinition<FilterShape>["input"],
    { options: FilterOption[] }
  >;
  value: unknown;
  onChange: (value: string | string[]) => void;
}) {
  const [search, setSearch] = React.useState("");
  const visible = input.options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const itemClassName = "min-h-11 gap-2 pr-2 text-sm sm:min-h-8 sm:text-[13px]";
  const options = visible.map((option) => {
    const content = (
      <>
        {option.marker}
        <span className="truncate">{option.label}</span>
      </>
    );
    if (input.type === "multiple") {
      const checked = Array.isArray(value) && value.includes(option.value);
      return (
        <DropdownMenuCheckboxItem
          key={option.value}
          checked={checked}
          onCheckedChange={() =>
            onChange(toggleFilterValue(value, option.value))
          }
          onSelect={(event) => event.preventDefault()}
          textValue={option.label}
          className={
            itemClassName +
            " [&>[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden"
          }
        >
          <CheckboxIndicator checked={checked} />
          {content}
        </DropdownMenuCheckboxItem>
      );
    }
    return (
      <DropdownMenuRadioItem
        key={option.value}
        value={option.value}
        onSelect={(event) => {
          event.preventDefault();
          onChange(option.value);
        }}
        textValue={option.label}
        className={itemClassName + " pr-8"}
      >
        {content}
      </DropdownMenuRadioItem>
    );
  });
  return (
    <>
      {input.options.length > 8 && (
        <div className="px-1 pb-1">
          <Input
            aria-label="Search filter values"
            placeholder="Search values…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleInputKeyDown}
            className="h-8 text-sm"
          />
        </div>
      )}
      <div className="max-h-64 overflow-y-auto">
        {visible.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            {input.options.length === 0
              ? "No values available."
              : "No matching values."}
          </p>
        )}
        {input.type === "multiple" ? (
          options
        ) : (
          <DropdownMenuRadioGroup
            value={typeof value === "string" ? value : ""}
          >
            {options}
          </DropdownMenuRadioGroup>
        )}
      </div>
    </>
  );
}

function FilterValueInput({
  value: initialValue,
  onChange,
  type,
  label,
}: {
  value: unknown;
  onChange: (value: string | number) => void;
  type: "text" | "number";
  label: string;
}) {
  const [text, setText] = React.useState(() =>
    typeof initialValue === "string" || typeof initialValue === "number"
      ? String(initialValue)
      : "",
  );
  const value =
    type === "number" ? (text.trim() === "" ? NaN : Number(text)) : text.trim();
  return (
    <form
      className="flex flex-col items-stretch gap-2 p-1 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isEmptyFilterValue(value)) onChange(value);
      }}
      onKeyDown={handleInputKeyDown}
    >
      <Input
        type={type}
        step={type === "number" ? "any" : undefined}
        aria-label={label}
        placeholder={label}
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

export function FilterValueSummary<F extends FilterShape>({
  field,
  value,
}: {
  field: FilterFieldDefinition<F>;
  value: unknown;
}) {
  const input = field.input;
  if (input.type === "text" || input.type === "number")
    return (
      <span className="truncate">
        {isEmptyFilterValue(value) ? "Choose value" : String(value)}
      </span>
    );
  const selected: string[] = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  const option = input.options.find((entry) => entry.value === selected[0]);
  const label =
    selected.length === 0
      ? "Choose value"
      : selected.length > 1 && input.type === "multiple"
        ? selected.length + " " + input.pluralLabel
        : (option?.label ?? "Unavailable value");
  return (
    <>
      {selected.length === 1 && option?.marker}
      <span className="truncate">{label}</span>
    </>
  );
}
