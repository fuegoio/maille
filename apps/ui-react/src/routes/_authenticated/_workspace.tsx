import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/navigation/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { fetchWorkspaceData } from "@/data";
import { useSync } from "@/stores/sync";
import { useWorkspaces } from "@/stores/workspaces";

export const Route = createFileRoute("/_authenticated/_workspace")({
  component: RouteComponent,
  beforeLoad: async () => {
    const workspacesState = useWorkspaces.getState();
    if (workspacesState.availableWorkspaces === null) {
      const workspaces = await workspacesState.fetchWorkspaces();
      if (workspaces.length === 0) {
        throw redirect({
          to: "/join",
        });
      }
    } else {
      void workspacesState.fetchWorkspaces();
    }

    let currentWorkspace = workspacesState.currentWorkspace;
    if (currentWorkspace === null) {
      const firstWorkspace = useWorkspaces.getState().availableWorkspaces![0];
      if (firstWorkspace) {
        await fetchWorkspaceData(firstWorkspace.id);
        currentWorkspace = useWorkspaces.getState().currentWorkspace;
      }
    }

    if (!currentWorkspace) {
      throw redirect({
        to: "/join",
      });
    }

    const syncState = useSync.getState();
    void syncState.dequeueMutations();

    return {
      workspace: currentWorkspace,
    };
  },
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  );
}
