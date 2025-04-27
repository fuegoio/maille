import dayjs from "dayjs";
import { defineStore } from "pinia";
import { ref } from "vue";
import type { UUID } from "crypto";
import type { Movement, MovementActivity } from "@maille/core/movements";
import { useAuthStore } from "./auth";
import { useStorage } from "@vueuse/core";
import { useActivitiesStore } from "./activities";
import type { ActivityMovement } from "@maille/core/activities";
import type { SyncEvent } from "@maille/core/sync";
import type { Mutation } from "@/mutations";

export const useMovementsStore = defineStore("movements", () => {
  const movements = useStorage<Movement[]>("movements", [], undefined, {
    serializer: {
      read: (v: any) => {
        if (!v) return null;
        return JSON.parse(v).map((a: any) => {
          return {
            ...a,
            date: dayjs(a.date),
          };
        });
      },
      write: (v: any) => JSON.stringify(v),
    },
  });
  const focusedMovement = ref<UUID | null>(null);

  const getMovementById = (movementId: UUID): Movement | undefined => {
    return movements.value.find((m) => m.id === movementId);
  };

  const addNewMovement = (
    date: dayjs.Dayjs,
    amount: number,
    account: UUID,
    name: string,
  ): Movement => {
    const { user } = useAuthStore();

    return addMovement({
      id: window.crypto.randomUUID(),
      user: user!.id,
      date,
      amount,
      account,
      name,
    });
  };

  const addMovement = (movement: {
    id: UUID;
    user: UUID;
    date: dayjs.Dayjs;
    amount: number;
    account: UUID;
    name: string;
  }) => {
    const newMovement = {
      ...movement,
      activities: [],
      status: "incomplete" as const,
    };
    movements.value.push(newMovement);
    return newMovement;
  };

  const updateMovement = (
    movementId: UUID,
    update: {
      name?: string;
      amount?: number;
      date?: dayjs.Dayjs;
    },
  ) => {
    const movement = getMovementById(movementId);
    if (!movement) return;

    if (update.name) movement.name = update.name;
    if (update.amount) movement.amount = update.amount;
    if (update.date) movement.date = update.date;

    movement.status =
      movement.activities.reduce((sum, ma) => sum + ma.amount, 0) ===
      movement.amount
        ? "completed"
        : "incomplete";
  };

  const deleteMovement = (movementId: UUID) => {
    const movement = getMovementById(movementId);
    if (!movement) return;

    const activitiesStore = useActivitiesStore();
    movement.activities.forEach((movementActivity) => {
      activitiesStore.deleteMovementActivityFromActivity(
        movementActivity.activity,
        movementActivity.id,
      );
    });

    movements.value.splice(movements.value.indexOf(movement), 1);
  };

  const restoreMovement = (movement: Movement) => {
    movements.value.push(movement);

    const activitiesStore = useActivitiesStore();
    movement.activities.forEach((movementActivity) => {
      activitiesStore.addMovementActivityToActivity(
        movement.id,
        movementActivity,
      );
    });
  };

  const createMovementActivity = (
    activityId: UUID,
    movementId: UUID,
    amount: number,
  ): MovementActivity => {
    const { user } = useAuthStore();
    const newMovementActivity = {
      id: window.crypto.randomUUID(),
      user: user!.id,
      activity: activityId,
      amount,
    };

    return addMovementActivity(movementId, newMovementActivity);
  };

  const addMovementActivity = (
    movementId: UUID,
    movementActivity: MovementActivity,
  ): MovementActivity => {
    const { user } = useAuthStore();

    const movement = getMovementById(movementId);
    if (!movement) throw new Error("movement not found");
    movement.activities.push(movementActivity);
    movement.status =
      movement.activities.reduce((sum, ma) => sum + ma.amount, 0) ===
      movement.amount
        ? "completed"
        : "incomplete";

    const activitiesStore = useActivitiesStore();
    activitiesStore.addMovementActivityToActivity(movementId, movementActivity);

    return movementActivity;
  };

  const addActivityMovementToMovement = (
    activityId: UUID,
    activityMovement: ActivityMovement,
  ): MovementActivity => {
    const movement = getMovementById(activityMovement.movement);
    if (!movement) throw new Error("movement not found");

    movement.activities.push({
      id: activityMovement.id,
      activity: activityId,
      amount: activityMovement.amount,
    });

    movement.status =
      movement.activities.reduce((sum, ma) => sum + ma.amount, 0) ===
      movement.amount
        ? "completed"
        : "incomplete";

    return movement.activities[movement.activities.length - 1];
  };

  const updateMovementActivity = (
    movementId: UUID,
    movementActivityId: UUID,
    amount: number,
  ) => {
    const movement = getMovementById(movementId);
    if (!movement) return;

    const movementActivity = movement.activities.find(
      (a) => a.id === movementActivityId,
    );
    if (!movementActivity) return;

    const activitiesStore = useActivitiesStore();
    activitiesStore.updateMovementActivityFromActivity(
      movementActivity.activity,
      movementActivity.id,
      amount,
    );

    movementActivity.amount = amount;
    movement.status =
      movement.activities.reduce((sum, ma) => sum + ma.amount, 0) ===
      movement.amount
        ? "completed"
        : "incomplete";
  };

  const deleteMovementActivity = (
    movementId: UUID,
    movementActivityId: UUID,
  ) => {
    const movement = getMovementById(movementId);
    if (!movement) throw new Error("movement not found");

    const movementActivityIndex = movement.activities.findIndex(
      (a) => a.id === movementActivityId,
    );
    if (movementActivityIndex === -1)
      throw new Error("movement activity not found");

    const movementActivity = movement.activities[movementActivityIndex];
    const activitiesStore = useActivitiesStore();
    activitiesStore.deleteMovementActivityFromActivity(
      movementActivity.activity,
      movementActivity.id,
    );

    movement.activities.splice(movementActivityIndex, 1);
    movement.status =
      movement.activities.reduce((sum, ma) => sum + ma.amount, 0) ===
      movement.amount
        ? "completed"
        : "incomplete";
  };

  // Events
  const handleEvent = (event: SyncEvent) => {
    if (event.type === "createMovement") {
      addMovement({
        ...event.payload,
        date: dayjs(event.payload.date),
      });
    } else if (event.type === "updateMovement") {
      updateMovement(event.payload.id, {
        ...event.payload,
        date: event.payload.date ? dayjs(event.payload.date) : undefined,
      });
    } else if (event.type === "deleteMovement") {
      deleteMovement(event.payload.id);
    } else if (event.type === "createMovementActivity") {
      addMovementActivity(event.payload.movement, event.payload);
    } else if (event.type === "updateMovementActivity") {
      updateMovementActivity(
        event.payload.movement,
        event.payload.id,
        event.payload.amount,
      );
    } else if (event.type === "deleteMovementActivity") {
      deleteMovementActivity(event.payload.movement, event.payload.id);
    }
  };

  // Mutations
  const handleMutationSuccess = (event: Mutation) => {
    if (!event.result) return;
  };

  const handleMutationError = (event: Mutation) => {
    if (event.name === "createMovement") {
      deleteMovement(event.variables.id);
    } else if (event.name === "updateMovement") {
      updateMovement(event.variables.id, {
        ...event.rollbackData,
        date: dayjs(event.rollbackData.date),
      });
    } else if (event.name === "deleteMovement") {
      restoreMovement(event.rollbackData);
    } else if (event.name === "createMovementActivity") {
      deleteMovementActivity(event.variables.movementId, event.variables.id);
    } else if (event.name === "updateMovementActivity") {
      updateMovementActivity(
        event.rollbackData.movement,
        event.variables.id,
        event.rollbackData.amount,
      );
    } else if (event.name === "deleteMovementActivity") {
      addMovementActivity(event.rollbackData.movement, event.rollbackData);
    }
  };

  return {
    movements,

    getMovementById,

    addNewMovement,
    deleteMovement,
    updateMovement,

    focusedMovement,

    createMovementActivity,
    addActivityMovementToMovement,
    updateMovementActivity,
    deleteMovementActivity,

    handleEvent,
    handleMutationSuccess,
    handleMutationError,
  };
});
