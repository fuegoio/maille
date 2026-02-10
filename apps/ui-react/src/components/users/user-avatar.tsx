import { useMemo } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/stores/auth";

interface UserAvatarProps {
  userId: string;
  className?: string;
}

export function UserAvatar({ userId, className }: UserAvatarProps) {
  const authUser = useAuth((state) => state.user);

  const userInitials = useMemo(() => {
    if (!authUser) return "?";
    if (authUser.id !== userId) return "?";
    return authUser.name[0];
  }, [authUser, userId]);

  return (
    <Avatar className={className}>
      <AvatarFallback>{userInitials}</AvatarFallback>
    </Avatar>
  );
}
