import { createFileRoute, notFound } from "@tanstack/react-router";
import z from "zod";

import { ActivityPage } from "@/components/activities/activity";
import { useActivities } from "@/stores/activities";

const searchParamsSchema = z.object({
  transaction: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/activities/$id")({
  validateSearch: searchParamsSchema,
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
  const { transaction } = Route.useSearch();
  const activity = useActivities((state) => state.getActivityById(id));
  if (!activity) {
    throw notFound();
  }

  return (
    <ActivityPage activityId={id} focusTransactionId={transaction ?? null} />
  );
}
