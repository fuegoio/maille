import { House, Plus } from "lucide-react";
import { useMemo } from "react";

import { useContextNavigate } from "@/components/navigation/breadcrumbs";
import { rowOutlineClasses } from "@/components/shared/row-outline";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useTableRows, type TableRow } from "@/hooks/use-table-rows";
import { cn } from "@/lib/utils";
import { getAssetValue } from "@/logic/assets";
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
  const contextNavigate = useContextNavigate();
  const assets = useAssets((state) => state.assets);
  const activities = useActivities((state) => state.activities);
  const currencyFormatter = useCurrencyFormatter();

  const accountAssets = useMemo(() => {
    return assets.filter((asset) => asset.account === accountId);
  }, [assets, accountId]);

  const rows = useMemo<TableRow[]>(
    () => accountAssets.map((asset) => ({ id: asset.id })),
    [accountAssets],
  );

  const { rowOutlines, registerRow } = useTableRows({
    rows,
    onOpen: (id) => {
      void contextNavigate({ to: "/assets/$id", params: { id } });
    },
  });

  const openAsset = (event: React.MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const id = (event.currentTarget as HTMLElement).dataset.assetId;
    if (!id) return;
    void contextNavigate({ to: "/assets/$id", params: { id } });
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
                ref={registerRow(asset.id)}
                data-asset-id={asset.id}
                className={cn(
                  "group flex h-10 w-full cursor-pointer items-center border-b pr-6 pl-14 transition-colors hover:bg-muted/50",
                  rowOutlines.has(asset.id) &&
                    rowOutlineClasses(rowOutlines.get(asset.id)!),
                )}
                onClick={openAsset}
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
                  {currencyFormatter.format(
                    getAssetValue(activities, asset.id),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
