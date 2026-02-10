import {
  ActivityFilterFields,
  type ActivityFilter,
} from "@maille/core/activities";
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

interface FilterActivitiesButtonProps {
  viewId: string;
  className?: string;
}

export function FilterActivitiesButton({
  viewId,
  className,
}: FilterActivitiesButtonProps) {
  const activityView = useViews((state) =>
    state.getActivityView(viewId),
  );
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
        <Button variant="ghost" className={className} size="sm">
          <ListFilter />
          Filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        {ActivityFilterFields.map((field) => (
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
