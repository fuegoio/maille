import type { Asset, AssetValuation } from "@maille/core/accounts";

import * as React from "react";

import { ValuationTimeline } from "@/components/shared/valuation-timeline";
import { getGraphQLDate } from "@/lib/date";
import {
  addAssetValuationMutation,
  deleteAssetValuationMutation,
  updateAssetValuationMutation,
} from "@/mutations/assets";
import { useAssets } from "@/stores/assets";
import { useSync } from "@/stores/sync";

const sameDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

interface AssetValuationSectionProps {
  asset: Asset;
}

/**
 * The asset's estimated-value timeline: dated observations of what it
 * is worth, next to the ledger's book value. The valuation layer — it
 * never books into the ledger.
 */
export function AssetValuationSection({ asset }: AssetValuationSectionProps) {
  const mutate = useSync((state) => state.mutate);
  const valuations = useAssets((state) => state.assetValuations);

  const assetValuationList = React.useMemo(
    () =>
      valuations
        .filter((valuation) => valuation.asset === asset.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [valuations, asset.id],
  );

  const addValuation = (date: Date, value: number) => {
    // One valuation per day: a day that already has one is updated in
    // place, matching the server's upsert.
    const existing = assetValuationList.find((point) =>
      sameDay(point.date, date),
    );
    if (existing) {
      updateValuation(existing, value);
      return;
    }

    const id = crypto.randomUUID();
    mutate({
      name: "addAssetValuation",
      mutation: addAssetValuationMutation,
      variables: {
        id,
        asset: asset.id,
        date: getGraphQLDate(date),
        value,
      },
      rollbackData: undefined,
      events: [
        {
          type: "addAssetValuation",
          payload: {
            id,
            asset: asset.id,
            date: date.toISOString(),
            value,
          },
        },
      ],
    });
  };

  const updateValuation = (valuation: AssetValuation, value: number) => {
    mutate({
      name: "updateAssetValuation",
      mutation: updateAssetValuationMutation,
      variables: { id: valuation.id, value },
      rollbackData: { ...valuation },
      events: [
        {
          type: "updateAssetValuation",
          payload: {
            id: valuation.id,
            asset: valuation.asset,
            value,
          },
        },
      ],
    });
  };

  const deleteValuation = (valuation: AssetValuation) => {
    mutate({
      name: "deleteAssetValuation",
      mutation: deleteAssetValuationMutation,
      variables: { id: valuation.id },
      rollbackData: { ...valuation },
      events: [
        {
          type: "deleteAssetValuation",
          payload: {
            id: valuation.id,
            asset: valuation.asset,
          },
        },
      ],
    });
  };

  return (
    <ValuationTimeline
      title="Estimated value"
      description="Dated observations of what the asset is worth — an appraisal, a trusted comp. Displayed next to the ledger's book value, never booked."
      valueLabel="Estimated value"
      emptyText="No estimate yet — the book value stands alone until the first observation."
      points={assetValuationList.map(({ id, date, value }) => ({
        id,
        date,
        value,
      }))}
      onAdd={addValuation}
      onUpdateValue={(pointId, value) => {
        const point = assetValuationList.find((v) => v.id === pointId);
        if (point) updateValuation(point, value);
      }}
      onDelete={(pointId) => {
        const point = assetValuationList.find((v) => v.id === pointId);
        if (point) deleteValuation(point);
      }}
    />
  );
}
