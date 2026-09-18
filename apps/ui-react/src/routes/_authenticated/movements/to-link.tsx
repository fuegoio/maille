import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/movements/to-link")({
  beforeLoad: () => {
    throw redirect({ to: "/movements", search: { view: "to-link" } });
  },
});
