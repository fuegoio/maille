import * as React from "react";

import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Calculator } from "./calculator";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface AmountInputNotClearableProps {
  clearable?: false;
  onChange: (value: number) => void;
}

interface AmountInputClearableProps {
  clearable: true;
  onChange: (value: number | null) => void;
}

type AmountInputProps = {
  value: number | null;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  mode: "field" | "cell";
  id?: string;
} & (AmountInputNotClearableProps | AmountInputClearableProps);

export function AmountInput({
  value,
  onChange,
  disabled = false,
  clearable,
  placeholder = "18,99 €",
  className,
  mode,
  id,
}: AmountInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [key, setKey] = React.useState(0);
  const currencyFormatter = useCurrencyFormatter();

  const handleOpenChange = (open: boolean) => {
    if (open) setKey((k) => k + 1); // remount Calculator to reset with fresh initialValue
    setIsOpen(open);
  };

  const handleValidate = (v: number | null) => {
    if (clearable) {
      (onChange as (v: number | null) => void)(v);
    } else if (v !== null) {
      (onChange as (v: number) => void)(v);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={mode === "cell" ? "ghost" : "outline"}
          disabled={disabled}
          className={cn(
            "font-mono font-normal",
            mode === "cell"
              ? "justify-end text-right"
              : "justify-start text-left",
            className,
          )}
        >
          {value !== null ? (
            currencyFormatter.format(value)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={10} className="w-48 gap-0 p-0">
        <Calculator
          key={key}
          initialValue={value}
          clearable={clearable as true}
          onValidate={handleValidate}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
