import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { Movement } from "@maille/core/movements";
import type { UUID } from "crypto";
import type { SyncEvent } from "@maille/core/sync";
import type { Mutation } from "@/mutations";
import { storage } from "./storage";

interface MovementsState {
  movements: Movement[];

  getMovementById: (movementId: UUID) => Movement | undefined;

  addMovement: (params: {
    id?: UUID;
    date: Date;
    amount: number;
    account: UUID;
    name: string;
    activities: any[];
  }) => Movement;

  updateMovement: (
    movementId: UUID,
    update: {
      date?: Date;
      amount?: number;
      account?: UUID;
      name?: string;
      activities?: any[];
    },
  ) => void;

  deleteMovement: (movementId: UUID) => void;
  restoreMovement: (movement: Movement) => void;

  handleEvent: (event: SyncEvent) => void;
  handleMutationSuccess: (event: any) => void;
  handleMutationError: (event: any) => void;
}

export const movementsStore = createStore<MovementsState>()(
  persist(
    (set, get) => ({
      movements: [],

      getMovementById: (movementId: UUID): Movement | undefined => {
        return get().movements.find((m) => m.id === movementId);
      },

      addMovement: ({
        id,
        date,
        amount,
        account,
        name,
        activities,
      }: {
        id?: UUID;
        date: Date;
        amount: number;
        account: UUID;
        name: string;
        activities: any[];
      }): Movement => {
        const newMovement = {
          id: id ?? crypto.randomUUID(),
          date,
          amount,
          account,
          name,
          activities,
          status: "incomplete" as const,
        };

        set((state) => ({
          movements: [...state.movements, newMovement],
        }));

        return newMovement;
      },

      updateMovement: (
        movementId: UUID,
        update: {
          date?: Date;
          amount?: number;
          account?: UUID;
          name?: string;
          activities?: any[];
        },
      ) => {
        set((state) => ({
          movements: state.movements.map((movement) => {
            if (movement.id === movementId) {
              return {
                ...movement,
                date: update.date !== undefined ? update.date : movement.date,
                amount: update.amount !== undefined ? update.amount : movement.amount,
                account: update.account !== undefined ? update.account : movement.account,
                name: update.name !== undefined ? update.name : movement.name,
                activities:
                  update.activities !== undefined ? update.activities : movement.activities,

                status:
                  (update.activities !== undefined
                    ? update.activities
                    : movement.activities
                  ).reduce((sum, ma) => sum + ma.amount, 0) ===
                  (update.amount !== undefined ? update.amount : movement.amount)
                    ? "completed"
                    : "incomplete",
              };
            }
            return movement;
          }),
        }));
      },

      deleteMovement: (movementId: UUID) => {
        set((state) => ({
          movements: state.movements.filter((movement) => movement.id !== movementId),
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
        }
      },
    }),
    {
      name: "movements",
      storage: storage,
    },
  ),
);
