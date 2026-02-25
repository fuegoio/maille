import { useNavigate } from "@tanstack/react-router";
import type { User } from "better-auth";
import { ChevronsUpDown, Loader, LogOut, GlobeOff } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth";
import useIsOnline from "@/lib/online";
import { useSync } from "@/stores/sync";

import { Contacts } from "../contacts/contacts";
import { SettingsDialog } from "../settings-dialog";
import { Badge } from "../ui/badge";

import { ThemeSwitcher } from "./theme-switcher";

export function UserNavigation({ user }: { user: User }) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const isOnline = useIsOnline();
  const mutationsQueue = useSync((state) => state.mutationsQueue);

  const logout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          localStorage.clear();
          await navigate({ to: "/login" });
        },
      },
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="size-5">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {mutationsQueue.length > 0 || !isOnline ? (
                  <Badge
                    variant="secondary"
                    className="h-6 font-normal text-muted-foreground"
                  >
                    {isOnline ? (
                      <>
                        <Loader className="size-3 animate-spin" />
                        {mutationsQueue.length} event
                        {mutationsQueue.length > 1 ? "s" : ""} syncing...
                      </>
                    ) : (
                      <>
                        <GlobeOff className="size-3" />
                        Offline
                      </>
                    )}
                  </Badge>
                ) : (
                  <span className="truncate font-medium">{user.name}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                <Avatar className="size-7">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Contacts />
            <SettingsDialog />
            <DropdownMenuSeparator />
            <ThemeSwitcher />
            <DropdownMenuItem className="gap-2 px-3" onClick={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
