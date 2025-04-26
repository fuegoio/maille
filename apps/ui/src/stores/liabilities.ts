import { defineStore } from "pinia";

import type { Liability } from "@maille/core/liabilities";

import { type UUID } from "crypto";
import { useStorage } from "@vueuse/core";
import type { Activity } from "@maille/core/activities";
import dayjs from "dayjs";

export const useLiabilitiesStore = defineStore("liabilities", () => {
  const liabilities = useStorage<Liability[]>("liabilities", [], undefined, {
    serializer: {
      read: (v: string) => {
        if (!v) return null;
        return JSON.parse(v).map((a: any) => {
          return {
            ...a,
            date: dayjs(a.date),
          };
        });
      },
      write: (v: Activity[]) => JSON.stringify(v),
    },
  });

  const getLiabilitiesByActivity = (
    activityId: UUID,
  ): Liability[] | undefined => {
    return liabilities.value.filter((a) => a.activity === activityId);
  };

  const addLiability = (input: {
    amount: number;
    activity: Activity;
    account: UUID;
    linkId: UUID;
  }) => {
    const liability: Liability = {
      ...input,
      activity: input.activity.id,
      name: input.activity.name,
      date: input.activity.date,
      status: "completed",
    };
    liabilities.value.push(liability);

    return liability;
  };

  const getLiability = (account: UUID, activity: UUID) => {
    const liability = liabilities.value.find(
      (l) => l.account === account && l.activity === activity,
    );
    return liability;
  };

  const deleteLiabilitiesActivity = (activity: UUID) => {
    liabilities.value = liabilities.value.filter(
      (l) => l.activity !== activity,
    );
  };

  const updateLiabilitiesLinkId = (
    activityId: UUID,
    liabilitiesUpdates: { account: UUID; linkId: UUID }[],
  ) => {
    liabilitiesUpdates.forEach((liability) => {
      const liabilityStored = liabilities.value.find(
        (l) => l.account === liability.account && l.activity === activityId,
      );
      if (liabilityStored) {
        liabilityStored.linkId = liability.linkId;
      }
    });
  };

  return {
    liabilities,
    getLiabilitiesByActivity,

    addLiability,
    getLiability,
    deleteLiabilitiesActivity,

    updateLiabilitiesLinkId,
  };
});
