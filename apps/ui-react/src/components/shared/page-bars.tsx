import * as React from "react";

import { cn } from "@/lib/utils";

export function PageBar({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="page-bar"
      className={cn(
        "flex h-12 min-w-0 shrink-0 items-center gap-2 border-b bg-card px-3 sm:px-4",
        className,
      )}
      {...props}
    />
  );
}

export function LedgerHeaderStrip({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="ledger-header-strip"
      className={cn(
        "flex h-8 shrink-0 items-center gap-4 border-b bg-muted/35 px-4 text-xs font-medium text-muted-foreground sm:px-6",
        className,
      )}
      {...props}
    />
  );
}
