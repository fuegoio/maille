import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useWorkspaces } from "@/stores/workspaces";

/**
 * A multi-select component for users that displays avatars of selected users
 * and provides a dropdown with checkboxes, avatars, and names for selection.
 *
 * @example
 * ```tsx
 * const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
 *
 * <UserMultiSelect
 *   value={selectedUserIds}
 *   onChange={setSelectedUserIds}
 *   placeholder="Select team members..."
 * />
 * ```
 */
interface UserMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  placeholder?: string;
}

export function UserMultiSelect({
  value,
  onChange,
  className,
  placeholder = "Select users...",
}: UserMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const workspace = useWorkspaces((state) => state.currentWorkspace);
  const users = workspace?.users || [];

  const handleCheckboxChange = (userId: string) => {
    const newValue = value.includes(userId)
      ? value.filter((id) => id !== userId)
      : [...value, userId];
    onChange(newValue);
  };

  const handleUserClick = (userId: string) => {
    const newValue = value.includes(userId)
      ? value.filter((id) => id !== userId)
      : [...value, userId];
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 items-center justify-between gap-1 rounded-lg border border-input bg-transparent p-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
            className,
          )}
        >
          <div className="flex flex-wrap gap-1">
            {value.length > 0 ? (
              users
                .filter((user) => value.includes(user.id))
                .map((user) => (
                  <Avatar key={user.id} className="size-6 border-2">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {user.name.at(0)}
                    </AvatarFallback>
                  </Avatar>
                ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "relative z-50 max-h-(--radix-popover-content-available-height) min-w-64 origin-(--radix-popover-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "gap-1 p-1",
        )}
        align="end"
        side="bottom"
      >
        {users.map((user) => (
          <div
            key={user.id}
            className={cn(
              "relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
              value.includes(user.id) && "bg-accent text-accent-foreground",
            )}
            onClick={(e) => {
              e.preventDefault();
              handleUserClick(user.id);
            }}
          >
            <Checkbox
              checked={value.includes(user.id)}
              onCheckedChange={() => handleCheckboxChange(user.id)}
              onClick={(e) => e.stopPropagation()}
              className="size-4"
            />
            <Avatar className="size-4.5">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {user.name.at(0)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{user.name}</span>
            {value.includes(user.id) && (
              <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                <CheckIcon className="pointer-events-none size-4" />
              </span>
            )}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
