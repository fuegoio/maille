import {
  Minus,
  Plus,
  X,
  Divide,
  Percent,
  Diff,
  Delete,
  Check,
} from "lucide-react";
import { evaluate } from "mathjs";
import * as React from "react";

import { cn } from "@/lib/utils";
import { getCurrencyFormatter } from "@/lib/utils";

import { Popover, PopoverTrigger, PopoverContent } from "./popover";

const CALCULATOR_KEYS = [
  "C",
  "plus-minus",
  "percentage",
  "divide",
  7,
  8,
  9,
  "multiply",
  4,
  5,
  6,
  "minus",
  1,
  2,
  3,
  "plus",
  "back",
  0,
  "point",
  "validate",
];

interface AmountInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
  borderless?: boolean;
  className?: string;
  id?: string;
}

export function AmountInput({
  value: externalValue,
  onChange,
  disabled = false,
  clearable = false,
  placeholder = "18,99 €",
  borderless = false,
  className,
  id,
}: AmountInputProps) {
  const [calculatorInput, setCalculatorInput] = React.useState<string>("");
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const calculatorRef = React.useRef<HTMLDivElement>(null);

  const computedCalculatorValue = React.useMemo(() => {
    try {
      const expression = calculatorInput.replace("×", "*").replace("÷", "/");
      const result = evaluate(expression);
      return Math.round(result * 100) / 100;
    } catch {
      return NaN;
    }
  }, [calculatorInput]);

  const isValueValid = React.useMemo(() => {
    return (
      !isNaN(computedCalculatorValue) || (calculatorInput === "" && clearable)
    );
  }, [computedCalculatorValue, calculatorInput, clearable]);

  const numberFormatter = React.useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, []);

  const handleCalculatorKey = React.useCallback(
    (key: number | string) => {
      if (typeof key === "number") {
        if (calculatorInput === "0") setCalculatorInput("");
        setCalculatorInput((prev) => prev.concat(key.toString()));
        return;
      }

      switch (key) {
        case "point":
          setCalculatorInput((prev) => prev + ".");
          break;

        case "plus":
          setCalculatorInput((prev) => prev + "+");
          break;
        case "minus":
          setCalculatorInput((prev) => prev + "-");
          break;
        case "multiply":
          setCalculatorInput((prev) => prev + "×");
          break;
        case "divide":
          setCalculatorInput((prev) => prev + "÷");
          break;
        case "percentage":
          setCalculatorInput((prev) => prev + "%");
          break;
        case "plus-minus":
          setCalculatorInput((prev) =>
            prev.startsWith("-") ? prev.substring(1) : "-" + prev,
          );
          break;

        case "C":
          setCalculatorInput("");
          break;
        case "back":
          setCalculatorInput((prev) =>
            prev.length > 0 ? prev.slice(0, -1) : prev,
          );
          break;

        case "validate":
          if (calculatorInput.length === 0 && clearable) {
            onChange(null);
            setIsOpen(false);
          } else if (isValueValid) {
            onChange(computedCalculatorValue);
            setIsOpen(false);
          }
          break;
      }
    },
    [
      calculatorInput,
      clearable,
      isValueValid,
      computedCalculatorValue,
      onChange,
    ],
  );

  const handleKeyPress = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!isNaN(parseInt(event.key))) {
        handleCalculatorKey(parseInt(event.key));
      }

      switch (event.key) {
        case "Enter":
          event.preventDefault();
          event.stopPropagation();
          handleCalculatorKey("validate");
          break;
        case "Backspace":
          handleCalculatorKey("back");
          break;
        case "*":
          handleCalculatorKey("multiply");
          break;
        case "/":
          handleCalculatorKey("divide");
          break;
        case "+":
          handleCalculatorKey("plus");
          break;
        case "-":
          handleCalculatorKey("minus");
          break;
        case "%":
          handleCalculatorKey("percentage");
          break;
        case ".":
          handleCalculatorKey("point");
          break;
      }
    },
    [handleCalculatorKey],
  );

  const currencyFormatter = getCurrencyFormatter();

  const handleOpenChange = (open: boolean) => {
    if (open && externalValue !== null) {
      setCalculatorInput(externalValue.toString());
    } else {
      setCalculatorInput("");
    }
    setIsOpen(open);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          id={id}
          className={cn(
            "flex h-10 items-center rounded font-mono whitespace-nowrap text-white",
            {
              "border-border": isOpen && !borderless,
              "hover:border-accent": !isOpen && !borderless,
              "bg-primary-700 hover:bg-primary-600 border px-3": !borderless,
              "hover:text-white": borderless,
            },
            className,
          )}
          disabled={disabled}
          onKeyDown={isOpen ? handleKeyPress : undefined}
        >
          {externalValue !== null ? (
            currencyFormatter.format(externalValue)
          ) : (
            <span className="text-primary-300">{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        ref={calculatorRef}
        className="bg-primary-700 ring-primary-600 ring-opacity-10 z-20 w-56 rounded-md p-0 shadow-lg ring-1 focus:outline-none"
        align="start"
        sideOffset={10}
        onKeyDown={handleKeyPress}
      >
        <div className="flex h-10 items-center px-4 font-mono text-sm">
          <div className="font-medium text-white">{calculatorInput}</div>
          <div className="flex-1" />
          <div className={`text-primary-100 $
              ${isNaN(computedCalculatorValue) || parseFloat(calculatorInput) === computedCalculatorValue ? "invisible" : ""}
            `}>{numberFormatter.format(computedCalculatorValue)}</div>
        </div>

        <div className="border-primary-600 grid grid-cols-4 gap-y-2 border-t px-2 py-4">
          {CALCULATOR_KEYS.map((touch) => (
            <div key={touch} className="flex justify-center">
              <button
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded text-white transition",
                  touch === "validate"
                    ? isValueValid
                      ? "bg-primary-600 hover:bg-primary-500"
                      : "bg-primary-800"
                    : "bg-primary-600 hover:bg-primary-500 shadow",
                )}
                onClick={() => handleCalculatorKey(touch)}
              >
                {typeof touch === "number" ? (
                  <span className="text-sm font-medium">{touch}</span>
                ) : touch === "point" ? (
                  <span>.</span>
                ) : touch === "divide" ? (
                  <Divide className="text-primary-100 h-4 w-4" />
                ) : touch === "multiply" ? (
                  <X className="text-primary-100 h-4 w-4" />
                ) : touch === "minus" ? (
                  <Minus className="text-primary-100 h-4 w-4" />
                ) : touch === "plus" ? (
                  <Plus className="text-primary-100 h-4 w-4" />
                ) : touch === "back" ? (
                  <Delete className="h-4 w-4" />
                ) : touch === "plus-minus" ? (
                  <Diff className="h-4 w-4 text-teal-500" />
                ) : touch === "percentage" ? (
                  <Percent className="h-4 w-4 text-teal-500" />
                ) : touch === "C" ? (
                  <span className="text-sm font-medium text-teal-500">C</span>
                ) : touch === "validate" ? (
                  <Check
                    className={cn(
                      "h-4 w-4",
                      isValueValid ? "text-white" : "text-primary-600",
                    )}
                  />
                ) : null}
              </button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

