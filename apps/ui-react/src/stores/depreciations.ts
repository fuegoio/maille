import type { AssetDepreciation } from "@maille/core/accounts";
import type { SyncEvent } from "@maille/core/sync";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

interface AssetDepreciationsState {
  depreciations: AssetDepreciation[];
  getDepreciationById: (id: string) => AssetDepreciation | undefined;
  getDepreciationByAsset: (assetId: string) => AssetDepreciation | undefined;
  addDepreciation: (depreciation: AssetDepreciation) => AssetDepreciation;
  updateDepreciation: (
    id: string,
    update: {
      basis?: number;
      months?: number;
      startMonth?: Date;
      expenseAccount?: string;
      category?: string | null;
      subcategory?: string | null;
    },
  ) => void;
  deleteDepreciation: (id: string) => void;
  restoreDepreciation: (depreciation: AssetDepreciation) => void;
  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: Mutation) => void;
  handleMutationError: (event: Mutation) => void;
}

export const useAssetDepreciations = create<AssetDepreciationsState>()(
  persist(
    (set, get) => ({
      depreciations: [],

      getDepreciationById: (id: string): AssetDepreciation | undefined => {
        return get().depreciations.find(
          (depreciation) => depreciation.id === id,
        );
      },

      getDepreciationByAsset: (
        assetId: string,
      ): AssetDepreciation | undefined => {
        return get().depreciations.find(
          (depreciation) => depreciation.asset === assetId,
        );
      },

      addDepreciation: (depreciation) => {
        set((state) => ({
          // One schedule per asset: the new one replaces a stale one
          depreciations: [
            ...state.depreciations.filter(
              (existing) => existing.asset !== depreciation.asset,
            ),
            depreciation,
          ],
        }));
        return depreciation;
      },

      updateDepreciation: (id, update) => {
        set((state) => ({
          depreciations: state.depreciations.map((depreciation) => {
            if (depreciation.id === id) {
              const filteredUpdate = Object.fromEntries(
                Object.entries(update).filter(
                  ([_, value]) => value !== undefined,
                ),
              );
              return {
                ...depreciation,
                ...filteredUpdate,
              };
            }
            return depreciation;
          }),
        }));
      },

      deleteDepreciation: (id) => {
        set((state) => ({
          depreciations: state.depreciations.filter(
            (depreciation) => depreciation.id !== id,
          ),
        }));
      },

      restoreDepreciation: (depreciation) => {
        set((state) => ({
          depreciations: [...state.depreciations, depreciation],
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createAssetDepreciation") {
          get().addDepreciation({
            ...event.payload,
            startMonth: new Date(event.payload.startMonth),
          });
        } else if (event.type === "updateAssetDepreciation") {
          get().updateDepreciation(event.payload.id, {
            ...event.payload,
            startMonth: event.payload.startMonth
              ? new Date(event.payload.startMonth)
              : undefined,
          });
        } else if (event.type === "deleteAssetDepreciation") {
          get().deleteDepreciation(event.payload.id);
        } else if (event.type === "deleteAsset") {
          // The schedule cascades with its asset
          set((state) => ({
            depreciations: state.depreciations.filter(
              (depreciation) => depreciation.asset !== event.payload.id,
            ),
          }));
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "createAssetDepreciation") {
          get().deleteDepreciation(event.variables.id);
        } else if (event.name === "updateAssetDepreciation") {
          get().updateDepreciation(event.variables.id, {
            ...event.rollbackData,
          });
        } else if (event.name === "deleteAssetDepreciation") {
          get().restoreDepreciation(event.rollbackData);
        }
      },
    }),
    {
      name: "assetDepreciations",
      storage: storage,
    },
  ),
);
