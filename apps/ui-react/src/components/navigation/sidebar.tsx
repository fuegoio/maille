import {
  ArrowRightLeft,
  BookMarked,
  Calendar,
  Folder,
  LayoutDashboard,
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

import { NavMain } from "./nav-main";
import { SidebarCalculator } from "./sidebar-calculator";
import { UserNavigation } from "./user-navigation";

const data = {
  navAnalysis: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      exact: true,
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
      icon: ArrowRightLeft,
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuth((state) => state.user);
  const [calculatorOpen, setCalculatorOpen] = React.useState(false);

  if (!user) {
    throw new Error("no user available");
  }

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.key === "m") {
        e.preventDefault();
        setCalculatorOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <UserNavigation user={user} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain title="Analysis" items={data.navAnalysis} />
        <NavMain title="Links" items={data.navLinks} />
        <NavMain title="Foundations" items={data.navFoundations} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarCalculator
          open={calculatorOpen}
          onToggle={() => setCalculatorOpen((prev) => !prev)}
          onClose={() => setCalculatorOpen(false)}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
