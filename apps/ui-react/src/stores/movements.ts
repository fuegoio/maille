import type { Movement, MovementActivity } from "@maille/core/movements";
import type { SyncEvent } from "@maille/core/sync";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Mutation } from "@/mutations";

import { storage } from "./storage";

interface MovementsState {
  movements: Movement[];
  focusedMovement: string | null;

  getMovementById: (movementId: string) => Movement | undefined;

  addMovement: (movement: Omit<Movement, "status">) => Movement;
  updateMovement: (
    movementId: string,
    update: {
      date?: Date;
      amount?: number;
      account?: string;
      name?: string;
    },
  ) => void;
  deleteMovement: (movementId: string) => void;
  restoreMovement: (movement: Movement) => void;

  setFocusedMovement: (movementId: string | null) => void;

  addMovementActivity: (
    movementId: string,
    movementActivity: MovementActivity,
  ) => MovementActivity;
  updateMovementActivity: (
    movementId: string,
    movementActivityId: string,
    update: Partial<MovementActivity>,
  ) => void;
  deleteMovementActivity: (
    movementId: string,
    movementActivityId: string,
  ) => void;

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

export const useMovements = create<MovementsState>()(
  persist(
    (set, get) => ({
      movements: [],
      focusedMovement: null,

      getMovementById: (movementId: string): Movement | undefined => {
        return get().movements.find((m) => m.id === movementId);
      },

      setFocusedMovement: (movementId: string | null) => {
        set({ focusedMovement: movementId });
      },

      addMovementActivity: (movementId, movementActivity) => {
        set((state) => ({
          movements: state.movements.map((movement) => {
            if (movement.id === movementId) {
              const newActivities = [...movement.activities, movementActivity];
              return {
                ...movement,
                activities: newActivities,
                status:
                  newActivities.reduce((sum, ma) => sum + ma.amount, 0) ===
                  movement.amount
                    ? "completed"
                    : "incomplete",
              };
            }
            return movement;
          }),
        }));

        return movementActivity;
      },
      updateMovementActivity: (movementId, movementActivityId, update) => {
        set((state) => ({
          movements: state.movements.map((movement) => {
            if (movement.id === movementId) {
              const updatedActivities = movement.activities.map((ma) =>
                ma.id === movementActivityId ? { ...ma, ...update } : ma,
              );

              return {
                ...movement,
                activities: updatedActivities,
                status:
                  updatedActivities.reduce((sum, ma) => sum + ma.amount, 0) ===
                  movement.amount
                    ? "completed"
                    : "incomplete",
              };
            }
            return movement;
          }),
        }));
      },
      deleteMovementActivity: (movementId, movementActivityId) => {
        set((state) => ({
          movements: state.movements.map((movement) => {
            if (movement.id === movementId) {
              const filteredActivities = movement.activities.filter(
                (ma) => ma.id !== movementActivityId,
              );

              return {
                ...movement,
                activities: filteredActivities,
                status:
                  filteredActivities.reduce((sum, ma) => sum + ma.amount, 0) ===
                  movement.amount
                    ? "completed"
                    : "incomplete",
              };
            }
            return movement;
          }),
        }));
      },

      addMovement: (movement) => {
        const newMovement = {
          ...movement,
          status:
            movement.activities.reduce((sum, ma) => sum + ma.amount, 0) ===
            movement.amount
              ? "completed"
              : "incomplete",
        } satisfies Movement;

        set((state) => ({
          movements: [...state.movements, newMovement],
        }));

        return newMovement;
      },
      updateMovement: (
        movementId: string,
        update: {
          date?: Date;
          amount?: number;
          account?: string;
          name?: string;
        },
      ) => {
        set((state) => ({
          movements: state.movements.map((movement) => {
            if (movement.id === movementId) {
              return {
                ...movement,
                ...update,
                status:
                  movement.activities.reduce(
                    (sum, ma) => sum + ma.amount,
                    0,
                  ) ===
                  (update.amount !== undefined
                    ? update.amount
                    : movement.amount)
                    ? "completed"
                    : "incomplete",
              };
            }
            return movement;
          }),
        }));
      },

      deleteMovement: (movementId: string) => {
        set((state) => ({
          movements: state.movements.filter(
            (movement) => movement.id !== movementId,
          ),
        }));
      },

      restoreMovement: (movement: Movement) => {
        set((state) => ({
          movements: [...state.movements, movement],
        }));
      },

      handleEvent: (event: SyncEvent) => {
        if (event.type === "createMovement") {
          get().addMovement({
            ...event.payload,
            date: new Date(event.payload.date),
            activities: [],
          });
        } else if (event.type === "updateMovement") {
          get().updateMovement(event.payload.id, {
            ...event.payload,
            date: event.payload.date ? new Date(event.payload.date) : undefined,
          });
        } else if (event.type === "deleteMovement") {
          get().deleteMovement(event.payload.id);
        } else if (event.type === "createMovementActivity") {
          get().addMovementActivity(event.payload.movement, event.payload);
        } else if (event.type === "updateMovementActivity") {
          get().updateMovementActivity(
            event.payload.movement,
            event.payload.id,
            event.payload,
          );
        } else if (event.type === "deleteMovementActivity") {
          get().deleteMovementActivity(
            event.payload.movement,
            event.payload.id,
          );
        }
      },

      handleMutationSuccess: (event: Mutation) => {
        if (!event.result) return;
      },

      handleMutationError: (event: Mutation) => {
        if (event.name === "createMovement") {
          get().deleteMovement(event.variables.id);
        } else if (event.name === "updateMovement") {
          get().updateMovement(event.variables.id, {
            ...event.rollbackData,
            date: new Date(event.rollbackData.date),
          });
        } else if (event.name === "deleteMovement") {
          get().restoreMovement(event.rollbackData);
        } else if (event.name === "createMovementActivity") {
          get().deleteMovementActivity(
            event.variables.movementId,
            event.variables.id,
          );
        } else if (event.name === "updateMovementActivity") {
          get().updateMovementActivity(
            event.rollbackData.movement,
            event.variables.id,
            event.rollbackData,
          );
        } else if (event.name === "deleteMovementActivity") {
          get().addMovementActivity(
            event.rollbackData.movement,
            event.rollbackData,
          );
        }
      },
    }),
    {
      name: "movements",
      storage: storage,
    },
  ),
);
