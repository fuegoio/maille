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
                  ? location.pathname.startsWith(item.url) &&
                    !item.items?.some((subItem) =>
                      location.pathname.startsWith(subItem.url),
                    )
                  : location.pathname === item.url
              }
            >
              <Link to={item.url}>
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
                      isActive={location.pathname.startsWith(subItem.url)}
                    >
                      <Link to={subItem.url}>
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
