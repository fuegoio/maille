import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppSidebar } from "@/components/navigation/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { fetchWorkspaceData } from "@/data";
import useIsOnline from "@/lib/online";
import { useSync } from "@/stores/sync";
import { useWorkspaces } from "@/stores/workspaces";

const WORKSPACE_REFRESH_INTERVAL = 1000 * 60 * 60;

export const Route = createFileRoute("/_authenticated/_workspace")({
  component: RouteComponent,
  beforeLoad: async () => {
    const workspacesState = useWorkspaces.getState();
    if (workspacesState.availableWorkspaces === null) {
      try {
        const workspaces = await workspacesState.fetchWorkspaces();
        if (workspaces.length === 0) {
          throw redirect({
            to: "/join",
          });
        }
      } catch (e) {
        if (e instanceof Error && e.message === "Unauthorized") {
          throw redirect({
            to: "/join",
          });
        }
        throw e;
      }
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

    return {
      workspace: currentWorkspace,
    };
  },
});

function RouteComponent() {
  const availableWorkspaces = useWorkspaces(
    (state) => state.availableWorkspaces,
  );
  const fetchWorkspaces = useWorkspaces((state) => state.fetchWorkspaces);

  useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      try {
        return await fetchWorkspaces();
      } catch (e) {
        if (e instanceof Error && e.message === "Unauthorized") {
          throw redirect({
            to: "/join",
          });
        }
        throw e;
      }
    },
    refetchInterval: WORKSPACE_REFRESH_INTERVAL,
    initialData: availableWorkspaces,
    throwOnError: true,
  });

  const dequeueMutations = useSync((state) => state.dequeueMutations);
  const online = useIsOnline();

  useEffect(() => {
    if (online) {
      void dequeueMutations();
    }
  }, [online, dequeueMutations]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  );
}
