import { createFileRoute, notFound } from "@tanstack/react-router";

import { AssetPage } from "@/components/accounts/assets/asset";
import { DeletedRedirect } from "@/components/shared/deleted-redirect";
import { useAssets } from "@/stores/assets";

export const Route = createFileRoute("/_authenticated/assets/$id")({
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
