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
  viewId: string;
  variant?: "default" | "mini";
  className?: string;
}

export function FilterMovementsButton({
  viewId,
  variant = "default",
  className,
}: FilterMovementsButtonProps) {
  const movementView = useViews((state) => state.getMovementView(viewId));
  const setMovementView = useViews((state) => state.setMovementView);
  const [open, setOpen] = React.useState(false);

  const selectField = (field: MovementFilter["field"]) => {
    setMovementView(viewId, {
      ...movementView,
      filters: [
        ...movementView.filters,
        {
          field: field,
          operator: undefined,
          value: undefined,
        } as MovementFilter,
      ],
    });
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {variant === "default" && (
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={className} size="sm">
            <ListFilter />
            <span className="font-normal">Filter</span>
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