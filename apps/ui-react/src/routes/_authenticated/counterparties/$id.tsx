import { createFileRoute, notFound } from "@tanstack/react-router";

import { CounterpartyPage } from "@/components/counterparties/counterparty";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { useCounterparties } from "@/stores/counterparties";

export const Route = createFileRoute("/_authenticated/counterparties/$id")({
  loader: async ({ params }) => {
    const counterparty = useCounterparties
      .getState()
      .getCounterpartyById(params.id);
    if (!counterparty) {
      throw notFound();
    }

    return { counterparty };
  },
  component: CounterpartyPageRoute,
});

function CounterpartyPageRoute() {
  const { id } = Route.useParams();
  const counterparty = useCounterparties((state) =>
    state.getCounterpartyById(id),
  );
  if (!counterparty) {
    return <DeletedRedirect target={{ to: "/counterparties" }} />;
  }

  return <CounterpartyPage counterpartyId={id} />;
}
