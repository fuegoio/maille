import { ChevronDownIcon } from "lucide-react";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { selectTriggerClass } from "./select";

type MultiSelectContext = {
  value: string[];
  onValueChange(value: string[]): void;
};
const MultiSelectContext = createContext<MultiSelectContext | null>(null);

interface MultiSelectProps {
  value: string[];
  onValueChange(value: string[]): void;
  children?: ReactNode;
}

/**
 * Example:
 *  <MultiSelect>
 *    <MultiSelectTrigger asChild>
 *      <MultiSelectValue />
 *    </MultiSelectTrigger>
 *    <MultiSelectContent>
 *      <MultiSelectItem>Item 1</MultiSelectItem>
 *      <MultiSelectItem>Item 2</MultiSelectItem>
 *      <MultiSelectItem>Item 3</MultiSelectItem>
 *    </MultiSelectContent>
 *  </MultiSelect>
 */
export function MultiSelect({
  value,
  onValueChange,
  children,
  ...props
}: MultiSelectProps & ComponentProps<typeof DropdownMenu>) {
  return (
    <DropdownMenu {...props}>
      <MultiSelectContext.Provider
        value={{
          value,
          onValueChange,
        }}
      >
        {children}
      </MultiSelectContext.Provider>
    </DropdownMenu>
  );
}

export function MultiSelectTrigger({
  className,
  children,
  noChevron,
  ...props
}: React.ComponentProps<typeof DropdownMenuTrigger> & {
  noChevron?: boolean;
}) {
  return (
    <DropdownMenuTrigger
      data-slot="multi-select-trigger"
      className={cn(selectTriggerClass, className)}
      {...props}
    >
      {children}
      {!noChevron && (
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      )}
    </DropdownMenuTrigger>
  );
}

export function MultiSelectValue({
  placeholder,
  renderValue,
}: {
  placeholder?: string;
  renderValue?: (value: string[]) => ReactNode;
}) {
  const context = useContext(MultiSelectContext);
  if (!context) {
    throw new Error("MultiSelectValue must be used within a MultiSelect.");
  }

  const value = context.value;
  if (value.length === 0)
    return <span className="text-muted-foreground">{placeholder}</span>;

  if (renderValue) return renderValue(value);

  return value.join(", ");
}

export const MultiSelectContent = DropdownMenuContent;

export function MultiSelectItem({
  value,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuItem> & {
  value: string;
}) {
  const context = useContext(MultiSelectContext);
  if (!context) {
    throw new Error("MultiSelectItem must be used within a MultiSelect.");
  }
  const globalValue = context.value;
  const onValueChange = context.onValueChange;

  const checked = globalValue.includes(value);
  const toggleValue = () => {
    if (!checked) {
      onValueChange(globalValue.concat([value]));
    } else {
      onValueChange(globalValue.filter((v) => v !== value));
    }
  };

  return (
    <DropdownMenuItem
      {...props}
      onSelect={(e) => {
        toggleValue();
        e.preventDefault();
      }}
    >
      <Checkbox checked={checked} onCheckedChange={toggleValue} />
      {children}
    </DropdownMenuItem>
  );
}
