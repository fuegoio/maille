import { useStore } from "zustand";
import { authStore } from "@/stores/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMemo } from "react";

interface UserAvatarProps {
  userId: string;
  className?: string;
}

export function UserAvatar({ userId, className }: UserAvatarProps) {
  const authUser = useStore(authStore, (state) => state.user);

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
