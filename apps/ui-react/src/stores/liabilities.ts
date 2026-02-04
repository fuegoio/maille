import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { Liability } from "@maille/core/liabilities";
import type { UUID } from "crypto";
import type { Activity } from "@maille/core/activities";
import { storage } from "./storage";

interface LiabilitiesState {
  liabilities: Liability[];

  getLiabilitiesByActivity: (activityId: UUID) => Liability[] | undefined;
  addLiability: (input: {
    amount: number;
    activity: Activity;
    account: UUID;
    id: UUID;
  }) => Liability;
  getLiability: (account: UUID, activity: UUID) => Liability | undefined;
  deleteLiabilitiesActivity: (activity: UUID) => void;
  updateLiabilitiesLinkId: (
    activityId: UUID,
    liabilitiesUpdates: { account: UUID; id: UUID }[],
  ) => void;
}

export const liabilitiesStore = createStore<LiabilitiesState>()(
  persist(
    (set, get) => ({
      liabilities: [],

      getLiabilitiesByActivity: (activityId: UUID): Liability[] | undefined => {
        return get().liabilities.filter((a) => a.activity === activityId);
      },

      addLiability: (input: {
        amount: number;
        activity: Activity;
        account: UUID;
        id: UUID;
      }): Liability => {
        const liability: Liability = {
          ...input,
          activity: input.activity.id,
          name: input.activity.name,
          date: input.activity.date,
        };

        set((state) => ({
          liabilities: [...state.liabilities, liability],
        }));

        return liability;
      },

      getLiability: (account: UUID, activity: UUID): Liability | undefined => {
        return get().liabilities.find((l) => l.account === account && l.activity === activity);
      },

      deleteLiabilitiesActivity: (activity: UUID) => {
        set((state) => ({
          liabilities: state.liabilities.filter((l) => l.activity !== activity),
        }));
      },

      updateLiabilitiesLinkId: (
        activityId: UUID,
        liabilitiesUpdates: { account: UUID; id: UUID }[],
      ) => {
        liabilitiesUpdates.forEach((liability) => {
          const liabilityStored = get().liabilities.find(
            (l) => l.account === liability.account && l.activity === activityId,
          );
          if (liabilityStored) {
            liabilityStored.id = liability.id;
          }
        });
      },
    }),
    {
      name: "liabilities",
      storage: storage,
    },
  ),
);
