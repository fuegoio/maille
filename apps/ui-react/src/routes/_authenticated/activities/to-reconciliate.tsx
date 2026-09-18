import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/activities/to-reconciliate",
)({
  beforeLoad: () => {
    throw redirect({ to: "/activities", search: { view: "reconcile" } });
  },
});
