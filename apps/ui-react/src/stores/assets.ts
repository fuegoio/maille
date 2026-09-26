import type { Asset, AssetValuation } from "@maille/core/accounts";
import type { SyncEvent } from "@maille/core/sync";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

interface AssetsState {
  assets: Asset[];
  assetValuations: AssetValuation[];
  getAssetById: (assetId: string) => Asset | undefined;
  getAssetsByAccount: (accountId: string) => Asset[];
  getValuationsByAsset: (assetId: string) => AssetValuation[];
  getValuationById: (valuationId: string) => AssetValuation | undefined;
  addAsset: (asset: Omit<Asset, "value">) => Asset;
  updateAsset: (
    assetId: string,
    update: {
      name?: string;
      description?: string | null;
      location?: string | null;
      value?: number;
    },
  ) => void;
  deleteAsset: (assetId: string) => void;
  restoreAsset: (asset: Asset, valuations: AssetValuation[]) => void;
  addAssetValuation: (valuation: AssetValuation) => void;
  updateAssetValuation: (
    valuationId: string,
    update: { date?: Date; value?: number },
  ) => void;
  deleteAssetValuation: (valuationId: string) => void;
  restoreAssetValuation: (valuation: AssetValuation) => void;
  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

const sameDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export const useAssets = create<AssetsState>()(
  persist(
    (set, get) => ({
      assets: [],
      assetValuations: [],

      getAssetById: (assetId): Asset | undefined => {
        return get().assets.find((a) => a.id === assetId);
      },

      getAssetsByAccount: (accountId): Asset[] => {
        return get().assets.filter((asset) => asset.account === accountId);
      },

      getValuationsByAsset: (assetId) => {
        return get().assetValuations.filter(
          (valuation) => valuation.asset === assetId,
        );
      },

      getValuationById: (valuationId) => {
        return get().assetValuations.find((v) => v.id === valuationId);
      },

      addAsset: (asset) => {
        const newAsset = {
          ...asset,
          value: 0, // TODO: determine value of asset
        };

        set((state) => ({
          assets: [...state.assets, newAsset],
        }));
        return newAsset;
      },

      updateAsset: (assetId, update) => {
        set((state) => ({
          assets: state.assets.map((asset) => {
            if (asset.id === assetId) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              return {
                ...asset,
                ...filteredUpdate,
              };
            }
            return asset;
          }),
        }));
      },

      // A deleted asset takes its valuations with it — the cascade owns
      // them on the server too.
      deleteAsset: (assetId) => {
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== assetId),
          assetValuations: state.assetValuations.filter(
            (valuation) => valuation.asset !== assetId,
          ),
        }));
      },

      restoreAsset: (asset, valuations) => {
        set((state) => ({
          assets: [...state.assets.filter((a) => a.id !== asset.id), asset],
          assetValuations: [
            ...state.assetValuations.filter(
              (existing) => !valuations.some((v) => v.id === existing.id),
            ),
            ...valuations,
          ],
        }));
      },

      // One valuation per day: a valuation for a day that already has
      // one replaces it, matching the server's upsert.
      addAssetValuation: (valuation) => {
        set((state) => ({
          assetValuations: [
            ...state.assetValuations.filter(
              (existing) =>
                !(
                  existing.asset === valuation.asset &&
                  sameDay(existing.date, valuation.date)
                ),
            ),
            valuation,
          ],
        }));
      },

      updateAssetValuation: (valuationId, update) => {
        set((state) => ({
          assetValuations: state.assetValuations.map((valuation) => {
            if (valuation.id === valuationId) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              return {
                ...valuation,
                ...filteredUpdate,
              };
            }
            return valuation;
          }),
        }));
      },

      deleteAssetValuation: (valuationId) => {
        set((state) => ({
          assetValuations: state.assetValuations.filter(
            (valuation) => valuation.id !== valuationId,
          ),
        }));
      },

      restoreAssetValuation: (valuation) => {
        set((state) => ({
          assetValuations: [
            ...state.assetValuations.filter((v) => v.id !== valuation.id),
            valuation,
          ],
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createAsset") {
          get().addAsset({
            ...event.payload,
          });
        } else if (event.type === "updateAsset") {
          get().updateAsset(event.payload.id, {
            ...event.payload,
          });
        } else if (event.type === "deleteAsset") {
          get().deleteAsset(event.payload.id);
        } else if (event.type === "addAssetValuation") {
          get().addAssetValuation({
            ...event.payload,
            date: new Date(event.payload.date),
          });
        } else if (event.type === "updateAssetValuation") {
          get().updateAssetValuation(event.payload.id, {
            ...(event.payload.date !== undefined
              ? { date: new Date(event.payload.date) }
              : {}),
            ...(event.payload.value !== undefined
              ? { value: event.payload.value }
              : {}),
          });
        } else if (event.type === "deleteAssetValuation") {
          get().deleteAssetValuation(event.payload.id);
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "createAsset") {
          get().deleteAsset(event.variables.id);
        } else if (event.name === "updateAsset") {
          get().updateAsset(event.variables.id, {
            ...event.rollbackData,
          });
        } else if (event.name === "deleteAsset") {
          get().restoreAsset(
            event.rollbackData.asset,
            event.rollbackData.valuations,
          );
        } else if (event.name === "addAssetValuation") {
          get().deleteAssetValuation(event.variables.id);
        } else if (event.name === "updateAssetValuation") {
          get().restoreAssetValuation(event.rollbackData);
        } else if (event.name === "deleteAssetValuation") {
          get().restoreAssetValuation(event.rollbackData);
        }
      },
    }),
    {
      name: "assets",
      storage: storage,
    },
  ),
);
