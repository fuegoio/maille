import { Link, useRouterState } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  title,
  items,
}: {
  title: string;
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    exact?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const location = useRouterState({ select: (s) => s.location });
  const { isMobile, setOpenMobile } = useSidebar();
  // Sub-views live in the query (?view=reconcile), so the active checks
  // match on the path and search together.
  const href = location.pathname + location.search;

  function handleLinkClick() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={
                !item.exact
                  ? href.startsWith(item.url) &&
                    !item.items?.some((subItem) => href.startsWith(subItem.url))
                  : location.pathname === item.url
              }
            >
              <Link to={item.url} onClick={handleLinkClick}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            {item.items?.length ? (
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={href.startsWith(subItem.url)}
                    >
                      <Link to={subItem.url} onClick={handleLinkClick}>
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            ) : null}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
