import {
  MovementFilterFields,
  type MovementFilter,
} from "@maille/core/movements";
import { ListFilter } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useViews } from "@/stores/views";

interface FilterMovementsButtonProps {
  viewId: string;
  className?: string;
}

export function FilterMovementsButton({
  viewId,
  className,
}: FilterMovementsButtonProps) {
  const movementView = useViews((state) => state.getMovementView(viewId));
  const [open, setOpen] = React.useState(false);

  const selectField = (field: MovementFilter["field"]) => {
    movementView.filters.push({
      field: field,
      operator: undefined,
      value: undefined,
    } as MovementFilter);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={className} size="sm">
          <ListFilter />
          <span className="font-normal">Filter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        {MovementFilterFields.map((field) => (
          <DropdownMenuItem
            key={field.value}
            onSelect={() => selectField(field.value)}
          >
            <div className="flex items-center">
              <i
                className={`mdi mt-0.5 mr-2 ${field.icon}`}
                aria-hidden="true"
              />
              <span>{field.text}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
