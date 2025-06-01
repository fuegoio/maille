import { defineStore } from "pinia";

import type { Liability } from "@maille/core/liabilities";

import type { UUID } from "crypto";
import { useStorage } from "@vueuse/core";
import type { Activity } from "@maille/core/activities";
import type { SyncEvent } from "@maille/core/sync";
import type { Mutation } from "@/mutations";
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
      write: (v: Liability[]) => JSON.stringify(v),
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
    id: UUID;
  }) => {
    const liability: Liability = {
      ...input,
      activity: input.activity.id,
      name: input.activity.name,
      date: input.activity.date,
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

  const updateLiability = (
    id: UUID,
    updates: Partial<Pick<Liability, "name" | "other" | "other_user">>,
  ) => {
    const liability = liabilities.value.find((l) => l.id === id);
    if (liability) {
      Object.assign(liability, updates);
    }
    return liability;
  };

  const updateLiabilitiesLinkId = (
    activityId: UUID,
    liabilitiesUpdates: { account: UUID; id: UUID }[],
  ) => {
    liabilitiesUpdates.forEach((liability) => {
      const liabilityStored = liabilities.value.find(
        (l) => l.account === liability.account && l.activity === activityId,
      );
      if (liabilityStored) {
        liabilityStored.id = liability.id;
      }
    });
  };

  const handleEvent = (event: SyncEvent) => {
    if (event.type === "updateLiability") {
      updateLiability(event.payload.id, {
        name: event.payload.name,
        other: event.payload.other,
        other_user: event.payload.other_user,
      });
    }
  };

  const handleMutationSuccess = (mutation: Mutation) => {
    // Handle successful mutations if needed
  };

  const handleMutationError = (mutation: Mutation) => {
    // Handle failed mutations if needed
  };

  return {
    liabilities,
    getLiabilitiesByActivity,

    addLiability,
    getLiability,
    updateLiability,
    deleteLiabilitiesActivity,

    updateLiabilitiesLinkId,

    handleEvent,
    handleMutationSuccess,
    handleMutationError,
  };
});
