import { FUND_COLOR_NAMES, FUND_COLORS } from "@maille/core/funds";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { shadeRamp, swatchCheckColor } from "@/lib/fund-colors";
import { cn } from "@/lib/utils";

type FundColor = (typeof FUND_COLORS)[number];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  // Active hue anchor, or null on the all-colors level.
  const [hue, setHue] = useState<FundColor | null>(null);
  const reducedMotion = useReducedMotion();

  // Direction of the last level change, so the swap animation reads correctly.
  const directionRef = useRef(1);
  // Hue the user drilled into, so going back can restore focus on its swatch.
  const lastHueRef = useRef<FundColor | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const shades = useMemo(() => (hue ? shadeRamp(hue) : null), [hue]);

  useEffect(() => {
    if (!open) return;
    // The focused swatch unmounts on a level change: move focus to the back
    // control when refining, back to the hue swatch when returning.
    if (hue) {
      backRef.current?.focus();
    } else if (lastHueRef.current) {
      contentRef.current
        ?.querySelector<HTMLButtonElement>(`[data-hue="${lastHueRef.current}"]`)
        ?.focus();
    }
  }, [hue, open]);

  // Closing programmatically (selecting a shade) does not fire onOpenChange:
  // level state must be cleared here too.
  const reset = () => {
    setHue(null);
    lastHueRef.current = null;
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const drill = (color: FundColor) => {
    directionRef.current = 1;
    lastHueRef.current = color;
    setHue(color);
    // Selecting the hue itself is the default; a value already refined
    // within this hue's ramp keeps its shade.
    if (!shadeRamp(color).includes(value)) onChange(color);
  };

  const goBack = () => {
    directionRef.current = -1;
    setHue(null);
  };

  const select = (color: string) => {
    onChange(color);
    setOpen(false);
    reset();
  };

  const header = hue ? (
    <button
      ref={backRef}
      type="button"
      className="flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground outline-none hover:bg-muted/50 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      onClick={goBack}
      aria-label="Back to all colors"
    >
      <ChevronLeft className="size-3.5" />
      {FUND_COLOR_NAMES[hue]}
    </button>
  ) : (
    <div className="flex h-7 items-center px-1.5 text-xs font-medium text-muted-foreground">
      Colors
    </div>
  );

  const hueName = hue ? FUND_COLOR_NAMES[hue] : null;

  const swatches = shades
    ? shades.map((color, index) => (
        <Button
          key={color}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          aria-label={`${index === 0 ? hueName : `${hueName}, shade ${index + 1} of ${shades.length}`}${
            color === value ? ", selected" : ""
          }`}
          onClick={() => select(color)}
        >
          <span
            className="flex size-5 items-center justify-center rounded-sm"
            style={{ backgroundColor: color }}
          >
            {color === value && (
              <Check
                className="size-3"
                style={{ color: swatchCheckColor(color) }}
              />
            )}
          </span>
        </Button>
      ))
    : FUND_COLORS.map((color) => (
        <Button
          key={color}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          data-hue={color}
          aria-label={`${FUND_COLOR_NAMES[color]}${
            color === value ? ", selected" : ""
          }`}
          onClick={() => drill(color)}
        >
          <span
            className="flex size-5 items-center justify-center rounded-sm"
            style={{ backgroundColor: color }}
          >
            {color === value && (
              <Check
                className="size-3"
                style={{ color: swatchCheckColor(color) }}
              />
            )}
          </span>
        </Button>
      ));

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", className)}
          aria-label="Pick a color"
        >
          <span
            className="size-5 rounded-sm"
            style={{ backgroundColor: value }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        className="w-auto gap-1.5 p-2"
        onEscapeKeyDown={(event) => {
          // Escape goes back one level before it closes the popover.
          if (hue) {
            event.preventDefault();
            goBack();
          }
        }}
      >
        <motion.div
          key={hue ?? "colors"}
          initial={{
            opacity: 0,
            x: reducedMotion ? 0 : 6 * directionRef.current,
          }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: reducedMotion ? 0.01 : 0.12,
            ease: "easeOut",
          }}
          className="flex flex-col gap-1.5"
        >
          {header}
          <div className="grid grid-cols-6 gap-1">{swatches}</div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
