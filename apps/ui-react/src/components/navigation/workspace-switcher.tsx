import type { Workspace } from "@maille/core/workspaces";
import { Link } from "@tanstack/react-router";
import type { User } from "better-auth";
import { ChevronsUpDown, Loader, LogOut, Plus, GlobeOff } from "lucide-react";

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
import useIsOnline from "@/lib/online";
import { useSync } from "@/stores/sync";
import type { AvailableWorkspace } from "@/stores/workspaces";

import { Badge } from "../ui/badge";
import { WorkspaceUsers } from "../users/workspace-users";

import { ThemeSwitcher } from "./theme-switcher";

export function WorkspaceSwitcher({
  user,
  currentWorkspace,
  availableWorkspaces,
}: {
  user: User;
  currentWorkspace: Workspace;
  availableWorkspaces: AvailableWorkspace[];
}) {
  const { isMobile } = useSidebar();

  const isOnline = useIsOnline();
  const mutationsQueue = useSync((state) => state.mutationsQueue);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-5 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"></div>
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
                  <span className="truncate font-medium">
                    {currentWorkspace.name}
                  </span>
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {availableWorkspaces.map((workspace) => (
              <DropdownMenuItem key={workspace.id} className="gap-2 p-2">
                <div
                  className="flex size-6 items-center justify-center rounded-md border
                  bg-sidebar-primary
                  "
                ></div>
                {workspace.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link to="/join">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground">Create workspace</div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <WorkspaceUsers />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                <Avatar className="size-6 rounded-lg">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ThemeSwitcher />
            <DropdownMenuItem className="gap-2 px-3">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
