import * as React from "react";
import { useViews } from "@/stores/views";
import { MovementFilterFields, type MovementFilter } from "@maille/core/movements";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterMovementsButtonProps {
  viewId: string;
  className?: string;
}

export function FilterMovementsButton({ viewId, className }: FilterMovementsButtonProps) {
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
        <Button variant="outline" size="sm" className={className}>
          <Plus className="mr-2 h-4 w-4" />
          <span>Filter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        {MovementFilterFields.map((field) => (
          <DropdownMenuItem key={field.value} onSelect={() => selectField(field.value)}>
            <div className="flex items-center">
              <i className={`mdi mt-0.5 mr-2 ${field.icon}`} aria-hidden="true" />
              <span>{field.text}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
