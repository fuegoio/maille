import type { Asset } from "@maille/core/accounts";
import { useHotkey } from "@tanstack/react-hotkeys";
import { ChevronRight, Trash2 } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { deleteAssetMutation, updateAssetMutation } from "@/mutations/assets";
import { useActivities } from "@/stores/activities";
import { useAssets } from "@/stores/assets";
import { useSync } from "@/stores/sync";

export function Asset() {
  const assetId = useAssets((state) => state.focusedAsset);
  const setFocusedAsset = useAssets((state) => state.setFocusedAsset);

  const onClose = () => {
    setFocusedAsset(null);
  };

  const mutate = useSync((state) => state.mutate);

  const asset = useAssets((state) =>
    assetId ? state.getAssetById(assetId) : undefined,
  );
  const activities = useActivities((state) => state.activities);

  // Calculate the current value of the asset based on transactions
  const getAssetValue = React.useCallback(() => {
    if (!asset) return 0;

    return activities
      .flatMap((activity) => activity.transactions)
      .filter(
        (transaction) =>
          transaction.fromAsset === asset.id ||
          transaction.toAsset === asset.id,
      )
      .reduce((total, transaction) => {
        // If money flows TO the asset, it adds value
        if (transaction.toAsset === asset.id) {
          return total + transaction.amount;
        }
        // If money flows FROM the asset, it subtracts value
        else if (transaction.fromAsset === asset.id) {
          return total - transaction.amount;
        }
        return total;
      }, 0);
  }, [asset, activities]);

  // Get activities that involve this asset
  const assetActivities = React.useMemo(() => {
    if (!asset) return [];

    return activities.filter((activity) =>
      activity.transactions.some(
        (transaction) =>
          transaction.fromAsset === asset.id ||
          transaction.toAsset === asset.id,
      ),
    );
  }, [asset, activities]);

  const deleteAsset = () => {
    if (!asset) return;
    const assetData = { ...asset };
    mutate({
      name: "deleteAsset",
      mutation: deleteAssetMutation,
      variables: {
        id: asset.id,
      },
      rollbackData: assetData,
      events: [
        {
          type: "deleteAsset",
          payload: {
            id: asset.id,
          },
        },
      ],
    });
  };

  const handleUpdateAsset = (update: {
    name?: string;
    description?: string | null;
    location?: string | null;
  }) => {
    if (!asset) return;
    const assetData = { ...asset };
    mutate({
      name: "updateAsset",
      mutation: updateAssetMutation,
      variables: {
        id: asset.id,
        ...update,
      },
      rollbackData: assetData,
      events: [
        {
          type: "updateAsset",
          payload: {
            id: asset.id,
            ...update,
          },
        },
      ],
    });
  };

  // Hotkeys
  useHotkey("Escape", () => {
    onClose();
  });

  if (!asset) return null;

  const currencyFormatter = useCurrencyFormatter();

  return (
    <SidebarInset className="max-w-lg">
      <div className="flex h-full flex-col">
        <div className="flex h-12 w-full shrink-0 items-center border-b px-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-4 ml-8 h-8 w-6 lg:ml-0"
            onClick={onClose}
          >
            <ChevronRight className="h-6 w-6 transition hover:text-white" />
          </Button>
          <div className="text-sm font-medium text-white">Asset</div>

          <div className="flex-1" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete asset</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this asset? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAsset} variant="destructive">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mb-4 px-4 pt-6 sm:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              Current Value
            </div>
            <div className="text-right font-mono text-xl font-semibold whitespace-nowrap">
              {currencyFormatter.format(getAssetValue())}
            </div>
          </div>

          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Asset name</FieldLabel>
                <Input
                  id="name"
                  value={asset.name}
                  onChange={(e) => handleUpdateAsset({ name: e.target.value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  value={asset.description || ""}
                  onChange={(e) =>
                    handleUpdateAsset({ description: e.target.value || null })
                  }
                  className="resize-none"
                  placeholder="Add a description ..."
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <Input
                  id="location"
                  value={asset.location || ""}
                  onChange={(e) =>
                    handleUpdateAsset({ location: e.target.value || null })
                  }
                  placeholder="Add a location ..."
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>

        <div className="border-t px-4 py-6 sm:px-8">
          <div className="flex items-center">
            <div className="text-sm font-medium">
              Activities involving this asset
            </div>
            <div className="flex-1" />
          </div>

          <div className="mt-4 mb-2 rounded border bg-muted/50">
            {assetActivities.length === 0 ? (
              <div className="text-primary-300 flex items-center justify-center py-4 text-xs">
                No activities involve this asset yet.
              </div>
            ) : (
              assetActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex h-10 cursor-pointer items-center justify-center px-4 text-sm hover:bg-muted",
                    index !== assetActivities.length - 1 && "border-b",
                  )}
                >
                  <div className="hidden w-8 shrink-0 text-muted-foreground sm:block">
                    #{activity.number}
                  </div>
                  <div className="ml-2 hidden w-20 shrink-0 text-muted-foreground sm:block">
                    {activity.date.toLocaleDateString("fr-FR")}
                  </div>
                  <div className="w-10 shrink-0 text-muted-foreground sm:hidden">
                    {activity.date.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>

                  <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {activity.name}
                  </div>
                  <div className="flex-1" />
                  <div className="w-20 text-right font-mono whitespace-nowrap">
                    {currencyFormatter.format(activity.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
