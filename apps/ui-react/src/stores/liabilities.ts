import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Liability } from "@maille/core/liabilities";
import type { Activity } from "@maille/core/activities";
import { storage } from "./storage";

interface LiabilitiesState {
  liabilities: Liability[];

  getLiabilitiesByActivity: (activityId: string) => Liability[] | undefined;
  addLiability: (input: {
    amount: number;
    activity: Activity;
    account: string;
    id: string;
  }) => Liability;
  getLiability: (account: string, activity: string) => Liability | undefined;
  deleteLiabilitiesActivity: (activity: string) => void;
  updateLiabilitiesLinkId: (
    activityId: string,
    liabilitiesUpdates: { account: string; id: string }[],
  ) => void;
}

export const useLiabilities = create<LiabilitiesState>()(
  persist(
    (set, get) => ({
      liabilities: [],

      getLiabilitiesByActivity: (activityId: string): Liability[] | undefined => {
        return get().liabilities.filter((a) => a.activity === activityId);
      },

      addLiability: (input: {
        amount: number;
        activity: Activity;
        account: string;
        id: string;
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

      getLiability: (account: string, activity: string): Liability | undefined => {
        return get().liabilities.find((l) => l.account === account && l.activity === activity);
      },

      deleteLiabilitiesActivity: (activity: string) => {
        set((state) => ({
          liabilities: state.liabilities.filter((l) => l.activity !== activity),
        }));
      },

      updateLiabilitiesLinkId: (
        activityId: string,
        liabilitiesUpdates: { account: string; id: string }[],
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
