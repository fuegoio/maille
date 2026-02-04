import { AppSidebar } from "@/components/navigation/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { fetchWorkspaceData } from "@/data";
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

    if (workspacesState.currentWorkspace === null) {
      const firstWorkspace = workspacesStore.getState().availableWorkspaces![0];
      if (firstWorkspace) {
        await fetchWorkspaceData(firstWorkspace.id);
      }
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
