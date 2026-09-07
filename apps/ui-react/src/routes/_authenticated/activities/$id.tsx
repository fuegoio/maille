import { createFileRoute, notFound } from "@tanstack/react-router";

import { ActivityPage } from "@/components/activities/activity";
import { useActivities } from "@/stores/activities";

export const Route = createFileRoute("/_authenticated/activities/$id")({
  loader: async ({ params }) => {
    const activity = useActivities.getState().getActivityById(params.id);
    if (!activity) {
      throw notFound();
    }

    return { activity };
  },
  component: ActivityPageRoute,
});

function ActivityPageRoute() {
  const { id } = Route.useParams();
  const activity = useActivities((state) => state.getActivityById(id));
  if (!activity) {
    throw notFound();
  }

  return <ActivityPage activityId={id} />;
}
