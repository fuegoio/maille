import * as React from "react";
import {
  Banknote,
  BookMarked,
  BookOpen,
  Bot,
  Calendar,
  Folder,
  Frame,
  LayoutDashboard,
  LifeBuoy,
  Send,
  Settings2,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { useStore } from "zustand";
import { workspacesStore } from "@/stores/workspaces";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navAnalysis: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
    },
    {
      title: "Periods",
      url: "#",
      icon: Calendar,
      isActive: true,
      items: [
        {
          title: "Current",
          url: "#",
        },
        {
          title: "Past",
          url: "#",
        },
      ],
    },
    {
      title: "Projects",
      url: "#",
      icon: Folder,
    },
  ],
  navSource: [
    {
      title: "Activities",
      url: "#",
      icon: BookMarked,
      isActive: true,
      items: [
        {
          title: "To reconciliate",
          url: "#",
        },
      ],
    },
    {
      title: "Movements",
      url: "#",
      icon: Banknote,
      isActive: true,
      items: [
        {
          title: "To link",
          url: "#",
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
  const availableWorkspaces = useStore(
    workspacesStore,
    (state) => state.availableWorkspaces,
  );
  const currentWorkspace = useStore(
    workspacesStore,
    (state) => state.currentWorkspace,
  );

  if (!availableWorkspaces || !currentWorkspace) {
    throw new Error("no workspace available");
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher
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
