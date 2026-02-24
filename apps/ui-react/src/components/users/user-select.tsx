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
import { useContacts } from "@/stores/contacts";

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
  const contacts = useContacts((state) => state.contacts);
  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)} id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Contacts</SelectLabel>
          {contacts.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <UserAvatar user={user.contact} className="size-6" />
                <span>{user.contact.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
