import type { Asset } from "@maille/core/accounts";
import type { SyncEvent } from "@maille/core/sync";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

interface AssetsState {
  assets: Asset[];
  getAssetById: (assetId: string) => Asset | undefined;
  getAssetsByAccount: (accountId: string) => Asset[];
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
  restoreAsset: (asset: Asset) => void;
  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

export const useAssets = create<AssetsState>()(
  persist(
    (set, get) => ({
      assets: [],

      getAssetById: (assetId: string): Asset | undefined => {
        return get().assets.find((a) => a.id === assetId);
      },

      getAssetsByAccount: (accountId: string): Asset[] => {
        return get().assets.filter((asset) => asset.account === accountId);
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

      deleteAsset: (assetId: string) => {
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== assetId),
        }));
      },

      restoreAsset: (asset: Asset) => {
        set((state) => ({
          assets: [...state.assets, asset],
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
          get().restoreAsset(event.rollbackData);
        }
      },
    }),
    {
      name: "assets",
      storage: storage,
    },
  ),
);
