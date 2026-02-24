import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppSidebar } from "@/components/navigation/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { fetchUserData } from "@/data";
import { authClient } from "@/lib/auth";
import useIsOnline from "@/lib/online";
import { useAuth } from "@/stores/auth";
import { useSync } from "@/stores/sync";

const SESSION_REFRESH_INTERVAL = 1000 * 60 * 60;

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: async ({ location }) => {
    let session = useAuth.getState().session;
    let user = useAuth.getState().user;

    if (!session || !user) {
      const res = await authClient.getSession();
      if (!res.data?.session) {
        useAuth.getState().clear();
        throw redirect({
          to: `/login`,
          search: {
            redirect: location.pathname,
          },
        });
      }

      useAuth.getState().setUser(res.data.user, res.data.session);
      session = res.data.session;
      user = res.data.user;

      await fetchUserData();
    }

    return {
      session,
      user,
    };
  },
});

function AuthenticatedLayout() {
  const { session, user } = Route.useRouteContext();
  const navigate = Route.useNavigate();

  const setUser = useAuth((state) => state.setUser);

  const sessionData = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await authClient.getSession();
      if (res.error) throw new Error("error fetching session");

      if (res.data?.session) {
        setUser(res.data.user, res.data.session);
      } else {
        localStorage.clear();
        await navigate({ to: "/login" });
      }
      return res.data;
    },
    refetchInterval: SESSION_REFRESH_INTERVAL,
    initialData: {
      session,
      user,
    },
  });

  if (!sessionData.data && !sessionData.isError) {
    throw redirect({
      to: "/login",
    });
  }

  const subscribe = useSync((state) => state.subscribe);
  const dequeueMutations = useSync((state) => state.dequeueMutations);
  const online = useIsOnline();

  useEffect(() => {
    if (online) {
      void dequeueMutations();
    }
  }, [online, dequeueMutations]);

  useEffect(() => {
    void subscribe();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  );
}
