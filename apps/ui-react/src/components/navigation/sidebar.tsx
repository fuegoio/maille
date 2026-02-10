import {
  Banknote,
  BookMarked,
  Calendar,
  Folder,
  LayoutDashboard,
  LifeBuoy,
  Send,
} from "lucide-react";
import * as React from "react";
import { useStore } from "zustand";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { authStore } from "@/stores/auth";
import { useWorkspacesStore } from "@/stores/workspaces";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { WorkspaceSwitcher } from "./workspace-switcher";

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

  const availableWorkspaces = useWorkspacesStore(
    (state) => state.availableWorkspaces,
  );
  const currentWorkspace = useWorkspacesStore(
    (state) => state.currentWorkspace,
  );

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
