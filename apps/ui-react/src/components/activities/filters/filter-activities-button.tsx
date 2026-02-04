import * as React from "react";
import { useStore } from "zustand";
import { viewsStore } from "@/stores/views";
import { ActivityFilterFields, type ActivityFilter } from "@maille/core/activities";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterActivitiesButtonProps {
  viewId: string;
  className?: string;
}

export function FilterActivitiesButton({ viewId, className }: FilterActivitiesButtonProps) {
  const activityView = useStore(viewsStore, (state) => state.getActivityView(viewId));
  const [open, setOpen] = React.useState(false);

  const selectField = (field: ActivityFilter["field"]) => {
    activityView.filters.push({
      field: field,
      operator: undefined,
      value: undefined,
    } as ActivityFilter);
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
        {ActivityFilterFields.map((field) => (
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
