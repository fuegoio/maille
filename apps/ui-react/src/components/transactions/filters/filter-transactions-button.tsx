import type { TransactionFilter } from "@maille/core/views";

import { TransactionFilterFields } from "@maille/core/views";
import { ListFilter, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TransactionFilterIcons } from "./transaction-filters-icons";

interface FilterTransactionsButtonProps {
  filters: TransactionFilter[];
  onFiltersChange: (filters: TransactionFilter[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

export function FilterTransactionsButton({
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterTransactionsButtonProps) {
  const [open, setOpen] = React.useState(false);

  const selectField = (field: TransactionFilter["field"]) => {
    onFiltersChange([
      ...filters,
      {
        field: field,
        operator: undefined,
        value: undefined,
      } as unknown as TransactionFilter,
    ]);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {variant === "default" && (
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={className} size="sm">
            <ListFilter />
            <span className="hidden font-normal sm:inline">Filter</span>
          </Button>
        </DropdownMenuTrigger>
      )}
      {variant === "mini" && (
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={className} size="icon-sm">
            <Plus />
          </Button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent className="w-48">
        {TransactionFilterFields.map((field) => {
          const Icon = TransactionFilterIcons[field.value];
          return (
            <DropdownMenuItem
              key={field.value}
              onSelect={() => selectField(field.value)}
            >
              <Icon />
              {field.text}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
