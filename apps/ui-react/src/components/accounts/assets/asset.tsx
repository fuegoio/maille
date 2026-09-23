import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { House, Trash2 } from "lucide-react";
import { MapPin } from "lucide-react";
import * as React from "react";

import { AccountLabel } from "@/components/accounts/account-label";
import { AssetDepreciationSection } from "@/components/accounts/assets/asset-depreciation";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { ActivityViewSettingsButton } from "@/components/activities/activity-view-settings-button";
import { ExportActivitiesButton } from "@/components/activities/export-activities-button";
import { FilterActivitiesButton } from "@/components/activities/filters/filter-activities-button";
import {
  ContextLink,
  PageBreadcrumbs,
  usePageBreadcrumbs,
} from "@/components/navigation/breadcrumbs";
import { AmountPairsValue } from "@/components/shared/amount-pairs";
import {
  DebouncedInput,
  DebouncedTextarea,
} from "@/components/shared/debounced-text-field";
import { TableViewSettingsButton } from "@/components/shared/table-view-settings-button";
import { ViewActions } from "@/components/shared/view-actions";
import { ExportTransactionsButton } from "@/components/transactions/export-transactions-button";
import { FilterTransactionsButton } from "@/components/transactions/filters/filter-transactions-button";
import { TransactionsTable } from "@/components/transactions/transactions-table";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RollingAmount } from "@/components/ui/rolling-amount";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityIcon, TransactionIcon } from "@/lib/icons";
import { assetActivities, getAssetTotals, getAssetValue } from "@/logic/assets";
import { deleteAssetMutation, updateAssetMutation } from "@/mutations/assets";
import { useActivities } from "@/stores/activities";
import { useAssets } from "@/stores/assets";
import { useSync } from "@/stores/sync";

interface AssetPageProps {
  assetId: string;
}

export function AssetPage({ assetId }: AssetPageProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const mutate = useSync((state) => state.mutate);

  const asset = useAssets((state) => state.getAssetById(assetId));
  const activities = useActivities((state) => state.activities);

  const { view } = useSearch({ from: "/_authenticated/assets/$id" });
  const selectedTab = view ?? "asset";
  const selectTab = (value: string) =>
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        view:
          value === "asset"
            ? undefined
            : (value as "activities" | "transactions"),
      }),
    });

  const breadcrumbs = usePageBreadcrumbs({
    contextual: true,
    routeKey: "/assets/$id",
    own: {
      key: `asset:${assetId}`,
      label: asset?.name ?? "",
      title: asset?.name,
      target: { to: "/assets/$id", params: { id: assetId } },
    },
    fallback: [
      { key: "accounts", label: "Accounts", target: { to: "/accounts" } },
      ...(asset
        ? [
            {
              key: `account:${asset.account}`,
              label: <AccountLabel accountId={asset.account} />,
              target: {
                to: "/accounts/$id",
                params: { id: asset.account },
                search: { view: "assets" },
              },
            },
          ]
        : []),
    ],
  });

  // The asset's value and the in / out totals read from the same ledger
  // transactions the table below lists.
  const value = React.useMemo(
    () => getAssetValue(activities, assetId),
    [activities, assetId],
  );
  const totals = React.useMemo(
    () => getAssetTotals(activities, assetId),
    [activities, assetId],
  );

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (asset) {
      void router.navigate({
        to: "/accounts/$id",
        params: { id: asset.account },
        search: { view: "assets" },
      });
    } else {
      void router.navigate({ to: "/accounts" });
    }
  };

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

    goBack();
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

  // The embedded transactions table owns the page's keyboard: J/K and
  // Escape already move its row focus and clear its selection, so the
  // page keeps no hotkeys of its own.
  if (!asset) return null;

  const viewId = `asset-${asset.id}-transactions`;
  const activitiesViewId = `asset-${asset.id}-activities`;
  const assetActivitiesList = assetActivities(activities, asset.id).map(
    ({ activity }) => activity,
  );

  return (
    <SidebarInset>
      <div className="flex h-full flex-col">
        <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="mr-1" />
          <PageBreadcrumbs entries={breadcrumbs} className="flex-1" />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Delete asset">
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
        </header>

        <Tabs
          value={selectedTab}
          onValueChange={selectTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <header className="@container flex h-11 shrink-0 items-center gap-2 border-b bg-muted/30 px-2 sm:pr-4 sm:pl-7">
            <TabsList
              height="full"
              className="min-w-0 justify-start overflow-x-auto overflow-y-hidden [&_[data-slot=tabs-trigger]]:after:bottom-0"
            >
              <TabsTrigger value="asset">
                <House />
                Asset
              </TabsTrigger>
              <TabsTrigger value="activities">
                <ActivityIcon />
                Activities
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <TransactionIcon />
                Transactions
              </TabsTrigger>
            </TabsList>
            <div className="flex-1" />

            {selectedTab === "activities" && (
              <ViewActions>
                <FilterActivitiesButton viewId={activitiesViewId} />
                <ActivityViewSettingsButton viewId={activitiesViewId} />
                <ExportActivitiesButton
                  viewId={activitiesViewId}
                  activities={assetActivitiesList}
                />
              </ViewActions>
            )}

            {selectedTab === "transactions" && (
              <>
                <AmountPairsValue
                  className="mr-2 text-sm"
                  pairs={[
                    { dot: "bg-green-400", amount: totals.in },
                    { dot: "bg-red-400", amount: -totals.out },
                  ]}
                />
                <ViewActions>
                  <FilterTransactionsButton viewId={viewId} />
                  <TableViewSettingsButton kind="transaction" viewId={viewId} />
                  <ExportTransactionsButton
                    filter={{ kind: "asset", assetId: asset.id }}
                    viewId={viewId}
                  />
                </ViewActions>
              </>
            )}
          </header>

          <TabsContent value="asset" className="flex min-h-0 flex-1 flex-col">
            <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col @min-[70rem]:border-x">
              <div className="shrink-0 border-b px-4 py-6 sm:px-8">
                <div className="flex items-baseline justify-between gap-4">
                  <DebouncedInput
                    key={asset.id}
                    id="name"
                    aria-label="Asset name"
                    value={asset.name}
                    onCommit={(name) => handleUpdateAsset({ name })}
                    placeholder="Asset name"
                    className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0.5 text-3xl font-semibold md:text-3xl dark:bg-transparent"
                  />
                  <div
                    className="shrink-0 font-mono text-2xl leading-snug whitespace-nowrap tabular-nums"
                    title="Current value"
                  >
                    <RollingAmount value={value} />
                  </div>
                </div>

                <DebouncedTextarea
                  key={asset.id}
                  id="description"
                  aria-label="Description"
                  value={asset.description || ""}
                  onCommit={(description) =>
                    handleUpdateAsset({ description: description || null })
                  }
                  placeholder="Add a description ..."
                  rows={1}
                  className="mt-2 min-h-16 w-full resize-none border-0 bg-transparent px-0 py-0.5 text-sm dark:bg-transparent"
                />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    asChild
                    className="h-6 [a]:hover:bg-border/50"
                  >
                    <ContextLink
                      to="/accounts/$id"
                      params={{ id: asset.account }}
                      search={{ view: "assets" }}
                    >
                      <AccountLabel accountId={asset.account} size="sm" />
                    </ContextLink>
                  </Badge>

                  <label className="flex h-6 items-center gap-1.5 rounded-full border px-2.5">
                    <MapPin className="size-3 shrink-0 text-muted-foreground" />
                    <DebouncedInput
                      key={asset.id}
                      aria-label="Location"
                      value={asset.location || ""}
                      onCommit={(location) =>
                        handleUpdateAsset({ location: location || null })
                      }
                      placeholder="Add a location ..."
                      className="h-auto w-40 border-0 bg-transparent px-0 py-0 text-xs dark:bg-transparent"
                    />
                  </label>
                </div>
              </div>

              <AssetDepreciationSection asset={asset} />
            </div>
          </TabsContent>

          <TabsContent
            value="activities"
            className="flex min-h-0 flex-1 flex-col"
          >
            <ActivitiesTable
              viewId={activitiesViewId}
              activities={assetActivitiesList}
            />
          </TabsContent>

          <TabsContent
            value="transactions"
            className="flex min-h-0 flex-1 flex-col"
          >
            <TransactionsTable
              viewId={viewId}
              filter={{ kind: "asset", assetId: asset.id }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  );
}
