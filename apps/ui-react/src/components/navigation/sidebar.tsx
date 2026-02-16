import {
  Banknote,
  BookMarked,
  Calendar,
  Cog,
  Folder,
  LayoutDashboard,
  LifeBuoy,
  Send,
  Tag,
  TentTree,
} from "lucide-react";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/stores/auth";
import { useWorkspaces } from "@/stores/workspaces";

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
      title: "Months",
      url: "/months",
      icon: Calendar,
      items: [
        {
          title: "Current",
          url: "/months/current",
        },
        {
          title: "Past",
          url: "/months/past",
        },
      ],
    },
  ],
  navLinks: [
    {
      title: "Activities",
      url: "/activities",
      icon: BookMarked,
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
      items: [
        {
          title: "To link",
          url: "/movements/to-link",
        },
      ],
    },
  ],
  navFoundations: [
    {
      title: "Accounts",
      url: "/accounts",
      icon: Folder,
    },
    {
      title: "Categories",
      url: "/categories",
      icon: Tag,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: TentTree,
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
  const user = useAuth((state) => state.user);

  if (!user) {
    throw new Error("no user available");
  }

  const availableWorkspaces = useWorkspaces(
    (state) => state.availableWorkspaces,
  );
  const currentWorkspace = useWorkspaces((state) => state.currentWorkspace);

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
        <NavMain title="Links" items={data.navLinks} />
        <NavMain title="Foundations" items={data.navFoundations} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={data.navFooter} />
      </SidebarFooter>
    </Sidebar>
  );
}
