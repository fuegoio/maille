import * as React from "react";
import {
  Banknote,
  BookMarked,
  Calendar,
  Folder,
  LayoutDashboard,
  LifeBuoy,
  Send,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { useStore } from "zustand";
import { workspacesStore } from "@/stores/workspaces";
import { authStore } from "@/stores/auth";

const data = {
  navAnalysis: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Periods",
      url: "/periods",
      icon: Calendar,
      isActive: true,
      items: [
        {
          title: "Current",
          url: "/periods/current",
        },
        {
          title: "Past",
          url: "/periods/past",
        },
      ],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Folder,
    },
  ],
  navSource: [
    {
      title: "Activities",
      url: "/activities",
      icon: BookMarked,
      isActive: true,
      items: [
        {
          title: "To reconciliate",
          url: "/activities/to-reconciliate",
        },
      ],
    },
    {
      title: "Movements",
      url: "/movements",
      icon: Banknote,
      isActive: true,
      items: [
        {
          title: "To link",
          url: "/movements/to-link",
        },
      ],
    },
  ],
  navFooter: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useStore(authStore, (state) => state.user);

  if (!user) {
    throw new Error("no user available");
  }

  const availableWorkspaces = useStore(workspacesStore, (state) => state.availableWorkspaces);
  const currentWorkspace = useStore(workspacesStore, (state) => state.currentWorkspace);

  if (!availableWorkspaces || !currentWorkspace) {
    throw new Error("no workspace available");
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher
          user={user}
          availableWorkspaces={availableWorkspaces}
          currentWorkspace={currentWorkspace}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain title="Analysis" items={data.navAnalysis} />
        <NavMain title="Source" items={data.navSource} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={data.navFooter} />
      </SidebarFooter>
    </Sidebar>
  );
}
