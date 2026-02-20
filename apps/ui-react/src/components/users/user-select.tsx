import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useWorkspaces } from "@/stores/workspaces";

import { UserAvatar } from "./user-avatar";

interface UserSelectProps {
  id?: string;
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function UserSelect({
  id,
  value,
  onValueChange,
  className,
  placeholder = "Select a user",
}: UserSelectProps) {
  const workspace = useWorkspaces((state) => state.currentWorkspace);
  if (!workspace) {
    throw new Error("workspace not found");
  }

  const users = workspace.users || [];

  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)} id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Workspace users</SelectLabel>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <UserAvatar userId={user.id} className="size-6" />
                <span>{user.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
