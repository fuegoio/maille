import {
  ActivityFilterFields,
  type ActivityFilter,
} from "@maille/core/activities";
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

import { ActivityFilterIcons } from "./activity-filters-icons";

interface FilterActivitiesButtonProps {
  viewId: string;
  variant?: "default" | "mini";
  className?: string;
}

export function FilterActivitiesButton({
  viewId,
  variant = "default",
  className,
}: FilterActivitiesButtonProps) {
  const activityView = useViews((state) => state.getActivityView(viewId));
  const setActivityView = useViews((state) => state.setActivityView);
  const [open, setOpen] = React.useState(false);

  const selectField = (field: ActivityFilter["field"]) => {
    setActivityView(viewId, {
      ...activityView,
      filters: [
        ...activityView.filters,
        {
          field: field,
          operator: undefined,
          value: undefined,
        } as ActivityFilter,
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
        {ActivityFilterFields.map((field) => {
          const Icon = ActivityFilterIcons[field.value];
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
