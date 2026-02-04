import * as React from "react";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  value: number;
  onChange: (amount: number) => void;
  className?: string;
}

export function AmountInput({ value, onChange, className }: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onChange(isNaN(value) ? 0 : value);
  };

  return (
    <input
      type="number"
      value={value}
      onChange={handleChange}
      step="0.01"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  );
}