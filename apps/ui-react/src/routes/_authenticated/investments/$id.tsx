import { createFileRoute, notFound } from "@tanstack/react-router";
import z from "zod";

import { InvestmentPage } from "@/components/investments/investment";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { useInvestments } from "@/stores/investments";

const searchParamsSchema = z.object({
  /** "investment", "activities", or "transactions". */
  view: z.enum(["investment", "activities", "transactions"]).optional(),
});

export const Route = createFileRoute("/_authenticated/investments/$id")({
  validateSearch: searchParamsSchema,
  loader: async ({ params }) => {
    const investment = useInvestments.getState().getInvestmentById(params.id);
    if (!investment) {
      throw notFound();
    }

    return { investment };
  },
  component: InvestmentPageRoute,
});

function InvestmentPageRoute() {
  const { id } = Route.useParams();
  const { investment: loadedInvestment } = Route.useLoaderData();
  const investment = useInvestments((state) => state.getInvestmentById(id));
  if (!investment) {
    return (
      <DeletedRedirect
        target={{
          to: "/accounts/$id",
          params: { id: loadedInvestment.account },
        }}
      />
    );
  }

  return <InvestmentPage investmentId={id} />;
}
