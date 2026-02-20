import { House, Plus } from "lucide-react";
import { useMemo } from "react";

import { cn, getCurrencyFormatter } from "@/lib/utils";
import { useActivities } from "@/stores/activities";
import { useAssets } from "@/stores/assets";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../ui/empty";

import { AddAssetModal } from "./add-asset-modal";

interface AssetsTableProps {
  accountId: string;
}

export function AssetsTable({ accountId }: AssetsTableProps) {
  const assets = useAssets((state) => state.assets);
  const focusedAsset = useAssets((state) => state.focusedAsset);
  const setFocusedAsset = useAssets((state) => state.setFocusedAsset);
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = getCurrencyFormatter();

  const accountAssets = useMemo(() => {
    return assets.filter((asset) => asset.account === accountId);
  }, [assets, accountId]);

  const getAssetValue = (assetId: string) => {
    return activities
      .flatMap((activity) => activity.transactions)
      .filter(
        (transaction) =>
          transaction.fromAsset === assetId || transaction.toAsset === assetId,
      )
      .reduce((total, transaction) => {
        // If money flows TO the asset, it adds value
        if (transaction.toAsset === assetId) {
          return total + transaction.amount;
        }
        // If money flows FROM the asset, it subtracts value
        else if (transaction.fromAsset === assetId) {
          return total - transaction.amount;
        }
        return total;
      }, 0);
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        {accountAssets.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <House className="size-6 text-muted-foreground" />
                </div>
              </EmptyMedia>
              <EmptyTitle>No assets yet</EmptyTitle>
              <EmptyDescription>
                This account doesn't have any assets. Add your first asset to
                get started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <AddAssetModal accountId={accountId}>
                <Button>
                  <Plus />
                  Add asset
                </Button>
              </AddAssetModal>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-1 flex-col overflow-x-hidden">
            <header className="flex h-8 items-center border-b bg-muted/50 pr-6 pl-14 text-xs font-medium text-muted-foreground">
              <div className="flex-1">Asset name</div>
              <div className="text-right">Current value</div>
            </header>
            {accountAssets.map((asset) => (
              <div
                key={asset.id}
                className={cn(
                  "group flex h-10 w-full cursor-pointer items-center border-b pr-6 hover:bg-muted/50",
                  focusedAsset === asset.id
                    ? "border-l-4 border-l-primary bg-accent pl-13"
                    : "pl-14",
                )}
                onClick={() => setFocusedAsset(asset.id)}
              >
                <div className="text-sm font-semibold">{asset.name}</div>
                {asset.description && (
                  <div className="ml-4 text-sm text-muted-foreground">
                    {asset.description}
                  </div>
                )}
                <div className="flex-1" />

                {asset.location && (
                  <Badge className="mr-4" variant="outline">
                    {asset.location}
                  </Badge>
                )}

                <div className="text-right font-mono text-sm">
                  {currencyFormatter.format(getAssetValue(asset.id))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
