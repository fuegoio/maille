import type * as React from "react";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";

export function SelectSearchInput({
  placeholder = "Search ...",
  "aria-label": ariaLabel = "Search options",
  groupClassName,
  ...props
}: React.ComponentProps<typeof InputGroupInput> & { groupClassName?: string }) {
  return (
    <InputGroup
      className={cn(
        "gap-1 rounded-none border-t-0 border-r-0 border-b border-l-0 bg-background! ring-0!",
        groupClassName,
      )}
    >
      <InputGroupInput
        type="text"
        placeholder={placeholder}
        aria-label={ariaLabel}
        {...props}
      />
      <InputGroupAddon>
        <Search aria-hidden className="size-3 text-muted-foreground" />
      </InputGroupAddon>
    </InputGroup>
  );
}
