import * as React from "react";
import { useViews } from "@/stores/views";
import { LiabilityFilterFields, type LiabilityFilter } from "@maille/core/liabilities";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterLiabilitiesButtonProps {
  viewId: string;
  className?: string;
}

export function FilterLiabilitiesButton({ viewId, className }: FilterLiabilitiesButtonProps) {
  const liabilityView = useViews((state) => state.getLiabilityView(viewId));
  const [open, setOpen] = React.useState(false);

  const selectField = (field: LiabilityFilter["field"]) => {
    liabilityView.filters.push({
      field: field,
      operator: undefined,
      value: undefined,
    } as LiabilityFilter);
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
        {LiabilityFilterFields.map((field) => (
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
