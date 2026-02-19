import { House, Plus } from "lucide-react";
import { useMemo } from "react";

import { getCurrencyFormatter } from "@/lib/utils";
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
  const currencyFormatter = getCurrencyFormatter();

  const accountAssets = useMemo(() => {
    return assets.filter((asset) => asset.account === accountId);
  }, [assets, accountId]);

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
            {accountAssets.map((asset) => (
              <div
                key={asset.id}
                className="group flex h-10 w-full items-center border-b pr-6 pl-14 hover:bg-muted/50"
              >
                <div className="text-sm font-medium">{asset.name}</div>
                {asset.description && (
                  <div className="mx-2 text-sm text-muted-foreground">
                    {asset.description}
                  </div>
                )}
                {asset.location && (
                  <Badge className="ml-4" variant="outline">
                    {asset.location}
                  </Badge>
                )}

                <div className="flex-1" />

                <div className="text-right font-mono text-sm">
                  {currencyFormatter.format(asset.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
