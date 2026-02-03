import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth";
import { authStore } from "@/stores/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: async ({ location }) => {
    let session = authStore.getState().session;

    if (session) {
      authClient.getSession().then((res) => {
        if (res.data?.session) {
          authStore.getState().setUser(res.data.user, res.data.session);
        }
      });
    } else {
      const res = await authClient.getSession();
      if (!res.data?.session) {
        throw redirect({
          to: `/login`,
          search: {
            redirect: location.pathname,
          },
        });
      }

      authStore.getState().setUser(res.data.user, res.data.session);
      session = res.data.session;
    }

    return {
      session: session,
    };
  },
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
