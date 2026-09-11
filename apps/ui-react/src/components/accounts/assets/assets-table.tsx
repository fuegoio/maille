import { useHotkey } from "@tanstack/react-hotkeys";
import { House, Plus } from "lucide-react";
import { useMemo } from "react";

import {
  computeRowOutlines,
  rowOutlineClasses,
} from "@/components/shared/row-outline";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useListFocus } from "@/hooks/use-list-focus";
import { cn } from "@/lib/utils";
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
  const currencyFormatter = useCurrencyFormatter();

  const accountAssets = useMemo(() => {
    return assets.filter((asset) => asset.account === accountId);
  }, [assets, accountId]);

  const accountAssetIds = useMemo(
    () => accountAssets.map((asset) => asset.id),
    [accountAssets],
  );

  const { focusedId, registerRow, moveFocus, clearFocus } =
    useListFocus(accountAssetIds);

  // Hotkeys: J/K move a focused row through the list (K up, J down, first
  // row when nothing is focused), Enter opens the focused asset's panel
  useHotkey("K", (event) => {
    if (event.key !== "k") return;
    moveFocus(-1);
  });

  useHotkey("J", (event) => {
    if (event.key !== "j") return;
    moveFocus(1);
  });

  useHotkey(
    "Enter",
    () => {
      if (focusedId !== null) {
        setFocusedAsset(focusedId);
      }
    },
    {
      ignoreInputs: true,
    },
  );

  useHotkey(
    "Escape",
    () => {
      clearFocus();
    },
    {
      conflictBehavior: "allow",
    },
  );

  // Outline sides for selected rows: keyboard-focused or panel-open
  const rowOutlines = useMemo(
    () =>
      computeRowOutlines(
        accountAssets.map((asset) => ({
          id: asset.id,
          selected: asset.id === focusedId || asset.id === focusedAsset,
        })),
      ),
    [accountAssets, focusedId, focusedAsset],
  );

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
                ref={registerRow(asset.id)}
                className={cn(
                  "group flex h-10 w-full cursor-pointer items-center border-b pr-6 pl-14 hover:bg-muted/50",
                  rowOutlines.has(asset.id) &&
                    rowOutlineClasses(rowOutlines.get(asset.id)!),
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
