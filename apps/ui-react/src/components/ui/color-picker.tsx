import { FUND_COLORS } from "@maille/core/funds";
import { Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", className)}
          aria-label="Pick a color"
        >
          <span
            className="size-5 rounded-md"
            style={{ backgroundColor: value }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-6 gap-1">
          {FUND_COLORS.map((color) => (
            <Button
              key={color}
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted"
              aria-label={color}
              onClick={() => {
                onChange(color);
                setOpen(false);
              }}
            >
              <span
                className="flex size-5 items-center justify-center rounded-md"
                style={{ backgroundColor: color }}
              >
                {color === value && <Check className="size-3 text-white" />}
              </span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
