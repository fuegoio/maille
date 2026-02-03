import { authClient } from "@/lib/auth";
import { authStore } from "@/stores/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: async ({ location }) => {
    let session = authStore.getState().session;
    let user = authStore.getState().user;

    if (session && user) {
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
      user = res.data.user;
    }

    return {
      session,
      user,
    };
  },
});

function AuthenticatedLayout() {
  return <Outlet />;
}
