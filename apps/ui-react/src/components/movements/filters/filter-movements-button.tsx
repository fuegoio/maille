import {
  MovementFilterFields,
  type MovementFilter,
} from "@maille/core/movements";
import { ListFilter, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useViews } from "@/stores/views";

import { MovementFilterIcons } from "./movement-filters-icons";

interface FilterMovementsButtonProps {
  /** The store-backed view to filter; ignored when filters is provided. */
  viewId?: string;
  /** Filters to edit directly (a custom view); overrides viewId. */
  filters?: MovementFilter[];
  onFiltersChange?: (filters: MovementFilter[]) => void;
  variant?: "default" | "mini";
  className?: string;
}

export function FilterMovementsButton({
  viewId,
  filters,
  onFiltersChange,
  variant = "default",
  className,
}: FilterMovementsButtonProps) {
  const storeView = useViews((state) =>
    viewId === undefined ? undefined : state.getMovementView(viewId),
  );
  const setMovementView = useViews((state) => state.setMovementView);
  const [open, setOpen] = React.useState(false);

  const currentFilters = filters ?? storeView?.filters ?? [];

  const selectField = (field: MovementFilter["field"]) => {
    const nextFilters = [
      ...currentFilters,
      {
        field: field,
        operator: undefined,
        value: undefined,
      } as MovementFilter,
    ];
    if (onFiltersChange !== undefined) {
      onFiltersChange(nextFilters);
    } else if (viewId !== undefined && storeView !== undefined) {
      setMovementView(viewId, { ...storeView, filters: nextFilters });
    }
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
        {MovementFilterFields.map((field) => {
          const Icon = MovementFilterIcons[field.value];
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
