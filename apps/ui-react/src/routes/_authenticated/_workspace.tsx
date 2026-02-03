import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { workspacesStore } from "@/stores/workspaces";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_workspace")({
  component: RouteComponent,
  beforeLoad: async () => {
    const workspacesState = workspacesStore.getState();
    if (workspacesState.availableWorkspaces === null) {
      const workspaces = await workspacesState.fetchWorkspaces();
      if (workspaces.length === 0) {
        throw redirect({
          to: "/join",
        });
      }
    } else {
      workspacesState.fetchWorkspaces();
    }
  },
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
