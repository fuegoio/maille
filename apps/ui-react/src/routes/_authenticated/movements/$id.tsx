import { createFileRoute, notFound } from "@tanstack/react-router";

import { MovementPage } from "@/components/movements/movement";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { useMovements } from "@/stores/movements";

export const Route = createFileRoute("/_authenticated/movements/$id")({
  loader: async ({ params }) => {
    const movement = useMovements.getState().getMovementById(params.id);
    if (!movement) {
      throw notFound();
    }

    return { movement };
  },
  component: MovementPageRoute,
});

function MovementPageRoute() {
  const { id } = Route.useParams();
  const movement = useMovements((state) => state.getMovementById(id));
  if (!movement) {
    return <DeletedRedirect target={{ to: "/movements" }} />;
  }

  return <MovementPage movementId={id} />;
}
