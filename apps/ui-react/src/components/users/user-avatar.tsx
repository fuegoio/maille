import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user: {
    name: string;
    image?: string | null;
  };
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const userInitials = user.name.at(0);

  return (
    <Avatar className={className}>
      <AvatarImage src={user.image ?? undefined} />
      <AvatarFallback>{userInitials}</AvatarFallback>
    </Avatar>
  );
}
