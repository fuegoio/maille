import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * The filter and settings controls open their own portals; working
 * inside them is not leaving this tray.
 */
const keepNestedPortals = (event: {
  target: EventTarget | null;
  preventDefault: () => void;
}) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest("[data-radix-popper-content-wrapper]")) {
    event.preventDefault();
  }
};

/**
 * A page's view actions (filter, settings, export): one row when the
 * tabs header has room, collapsed behind a single trigger when it does
 * not — the tray holds the exact same controls, so the tabs keep their
 * width instead of scrolling. The tabs header carries `@container`;
 * below @3xl (48rem) of it the tray shows.
 */
export function ViewActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <div className={cn("hidden items-center gap-1 @3xl:flex", className)}>
        {children}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="View actions"
            className="@3xl:hidden"
          >
            <Ellipsis />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="flex w-auto items-center gap-1 p-1.5"
          onInteractOutside={keepNestedPortals}
          onFocusOutside={keepNestedPortals}
        >
          {children}
        </PopoverContent>
      </Popover>
    </>
  );
}
