import { createFileRoute, notFound } from "@tanstack/react-router";
import z from "zod";

import { AssetPage } from "@/components/accounts/assets/asset";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { useAssets } from "@/stores/assets";

const searchParamsSchema = z.object({
  /** "asset", "activities", or "transactions". */
  view: z.enum(["asset", "activities", "transactions"]).optional(),
});

export const Route = createFileRoute("/_authenticated/assets/$id")({
  validateSearch: searchParamsSchema,
  loader: async ({ params }) => {
    const asset = useAssets.getState().getAssetById(params.id);
    if (!asset) {
      throw notFound();
    }

    return { asset };
  },
  component: AssetPageRoute,
});

function AssetPageRoute() {
  const { id } = Route.useParams();
  const asset = useAssets((state) => state.getAssetById(id));
  if (!asset) {
    return <DeletedRedirect target={{ to: "/accounts" }} />;
  }

  return <AssetPage assetId={id} />;
}
