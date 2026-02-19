import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth";
import { useAuth } from "@/stores/auth";

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
    }

    return {
      session,
      user,
    };
  },
});

function AuthenticatedLayout() {
  const { session, user } = Route.useRouteContext();

  const setUser = useAuth((state) => state.setUser);
  const clear = useAuth((state) => state.clear);

  const sessionData = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await authClient.getSession();
      if (res.error) throw new Error("error fetching session");

      if (res.data?.session) {
        setUser(res.data.user, res.data.session);
      } else {
        clear();
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

  return <Outlet />;
}
