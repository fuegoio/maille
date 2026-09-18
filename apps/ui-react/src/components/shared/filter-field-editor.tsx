import type { LucideIcon } from "lucide-react";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { CheckboxIndicator } from "@/components/ui/checkbox";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
  defaultOperator: string;
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
      'button:not([disabled]), input:not([disabled]), [role="menuitemcheckbox"], [role="menuitemradio"]',
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

/** The same editor is mounted by the field submenu and by an existing filter chip. */
export function FilterFieldEditor<F extends FilterShape>({
  field,
  filter,
  onChange,
}: {
  field: FilterFieldDefinition<F>;
  filter?: F;
  onChange: (filter: F | null) => void;
}) {
  const [pending, setPending] = React.useState<F>(
    () =>
      ({
        ...filter,
        field: field.value,
        operator: filter?.operator ?? field.defaultOperator,
      }) as F,
  );
  const update = (patch: Partial<F>) => {
    const result = resolveFilterUpdate(
      pending,
      patch,
      field.operatorsWithoutValue,
    );
    setPending(result.pending);
    if (result.saved !== undefined) onChange(result.saved);
  };
  const withoutValue =
    field.operatorsWithoutValue?.includes(pending.operator ?? "") ?? false;
  const input = field.input;

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
            aria-label={field.text + " operator"}
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
      {withoutValue ? (
        <p className="px-2 py-2 text-xs text-muted-foreground">
          No value needed.
        </p>
      ) : input.type === "single" || input.type === "multiple" ? (
        <FilterChoiceList
          input={input}
          value={pending.value}
          onChange={(value) => update({ value } as Partial<F>)}
        />
      ) : (
        <FilterValueInput
          type={input.type}
          value={pending.value}
          label={field.text}
          onChange={(value) => update({ value } as Partial<F>)}
        />
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
        onSelect={(event) => event.preventDefault()}
        textValue={option.label}
        className={
          itemClassName +
          " [&>[data-slot=dropdown-menu-radio-item-indicator]]:hidden"
        }
      >
        <span
          aria-hidden
          className="grid size-4 shrink-0 place-items-center rounded-full border border-input"
        >
          {value === option.value && (
            <span className="size-2 rounded-full bg-primary" />
          )}
        </span>
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
            onValueChange={onChange}
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
