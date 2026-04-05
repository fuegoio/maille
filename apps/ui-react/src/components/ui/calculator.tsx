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

import { Button } from "./button";

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
] as const;

type CalculatorKey = (typeof CALCULATOR_KEYS)[number];

export interface CalculatorHandle {
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

interface CalculatorBaseProps {
  className?: string;
  initialValue?: number | null;
  autoFocus?: boolean;
}

interface CalculatorNotClearableProps extends CalculatorBaseProps {
  clearable?: false;
  onValidate?: (value: number) => void;
}

interface CalculatorClearableProps extends CalculatorBaseProps {
  clearable: true;
  onValidate?: (value: number | null) => void;
}

type CalculatorProps = CalculatorNotClearableProps | CalculatorClearableProps;

export const Calculator = React.forwardRef<CalculatorHandle, CalculatorProps>(
  function Calculator(
    { className, initialValue, autoFocus, clearable, onValidate },
    ref,
  ) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [input, setInput] = React.useState<string>(
      initialValue != null ? initialValue.toString() : "",
    );

    const decimalSeparator = React.useMemo(
      () => new Intl.NumberFormat().format(1.1).charAt(1),
      [],
    );

    const computedValue = React.useMemo(() => {
      try {
        const expression = input
          .replace("×", "*")
          .replace("÷", "/")
          .replace(",", ".");
        const result = evaluate(expression);
        return Math.round(result * 100) / 100;
      } catch {
        return NaN;
      }
    }, [input]);

    const isValueValid = !isNaN(computedValue) || (input === "" && !!clearable);

    const numberFormatter = React.useMemo(
      () =>
        new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }),
      [],
    );

    const handleKey = React.useCallback(
      (key: CalculatorKey) => {
        if (typeof key === "number") {
          if (input === "0") setInput("");
          setInput((prev) => prev.concat(key.toString()));
          return;
        }

        switch (key) {
          case "point":
            setInput((prev) => prev + decimalSeparator);
            break;
          case "plus":
            setInput((prev) => prev + "+");
            break;
          case "minus":
            setInput((prev) => prev + "-");
            break;
          case "multiply":
            setInput((prev) => prev + "×");
            break;
          case "divide":
            setInput((prev) => prev + "÷");
            break;
          case "percentage":
            setInput((prev) => prev + "%");
            break;
          case "plus-minus":
            setInput((prev) =>
              prev.startsWith("-") ? prev.substring(1) : "-" + prev,
            );
            break;
          case "C":
            setInput("");
            break;
          case "back":
            setInput((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
            break;
          case "validate":
            if (!onValidate) {
              // standalone mode: collapse expression to result
              if (!isNaN(computedValue)) setInput(computedValue.toString());
            } else if (input === "" && clearable) {
              (onValidate as (v: number | null) => void)(null);
            } else if (!isNaN(computedValue)) {
              onValidate(computedValue);
            }
            break;
        }
      },
      [input, computedValue, clearable, onValidate, decimalSeparator],
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (!isNaN(parseInt(event.key))) {
          handleKey(parseInt(event.key) as CalculatorKey);
          return;
        }
        switch (event.key) {
          case "Enter":
            event.preventDefault();
            event.stopPropagation();
            handleKey("validate");
            break;
          case "Backspace":
            handleKey("back");
            break;
          case "*":
            handleKey("multiply");
            break;
          case "/":
            handleKey("divide");
            break;
          case "+":
            handleKey("plus");
            break;
          case "-":
            handleKey("minus");
            break;
          case "%":
            handleKey("percentage");
            break;
          case ".":
          case ",":
            handleKey("point");
            break;
        }
      },
      [handleKey],
    );

    React.useImperativeHandle(ref, () => ({ handleKeyDown }), [handleKeyDown]);

    React.useEffect(() => {
      if (autoFocus) containerRef.current?.focus();
    }, [autoFocus]);

    return (
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={cn("flex flex-col outline-none", className)}
      >
        <div className="flex h-10 items-center px-4 font-mono text-sm">
          <div className="font-medium">
            {input || <span className="text-muted-foreground">0</span>}
          </div>
          <div className="flex-1" />
          <div
            className={cn(
              "text-xs text-muted-foreground",
              !isNaN(computedValue) && parseFloat(input) !== computedValue
                ? "visible"
                : "invisible",
            )}
          >
            {numberFormatter.format(computedValue)}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-y-2 border-t p-2">
          {CALCULATOR_KEYS.map((key) => (
            <div key={key} className="flex justify-center">
              <Button
                className="size-9"
                tabIndex={-1}
                variant={
                  key === "validate" && isValueValid ? "default" : "outline"
                }
                disabled={key === "validate" && !isValueValid}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKey(key)}
              >
                {typeof key === "number" ? (
                  <span className="text-sm font-medium">{key}</span>
                ) : key === "point" ? (
                  <span>{decimalSeparator}</span>
                ) : key === "divide" ? (
                  <Divide className="h-4 w-4" />
                ) : key === "multiply" ? (
                  <X className="h-4 w-4" />
                ) : key === "minus" ? (
                  <Minus className="h-4 w-4" />
                ) : key === "plus" ? (
                  <Plus className="h-4 w-4" />
                ) : key === "back" ? (
                  <Delete className="h-4 w-4" />
                ) : key === "plus-minus" ? (
                  <Diff className="h-4 w-4 text-teal-500" />
                ) : key === "percentage" ? (
                  <Percent className="h-4 w-4 text-teal-500" />
                ) : key === "C" ? (
                  <span className="text-sm font-medium text-teal-500">C</span>
                ) : key === "validate" ? (
                  <Check
                    className={cn(
                      "h-4 w-4",
                      isValueValid ? "text-white" : "text-primary-600",
                    )}
                  />
                ) : null}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  },
);
