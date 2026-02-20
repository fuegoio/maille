import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaces } from "@/stores/workspaces";

interface UserAvatarProps {
  userId: string;
  className?: string;
}

export function UserAvatar({ userId, className }: UserAvatarProps) {
  const workspace = useWorkspaces((state) => state.currentWorkspace);
  if (!workspace) {
    throw new Error("workspace not found");
  }

  const user = workspace.users?.find((u) => u.id === userId);
  if (!user) return null;

  const userInitials = user.name.at(0);

  return (
    <Avatar className={className}>
      <AvatarImage src={user.image ?? undefined} />
      <AvatarFallback>{userInitials}</AvatarFallback>
    </Avatar>
  );
}
