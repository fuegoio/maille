import type { SyncEvent } from "@maille/core/sync";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { graphql } from "@/gql";
import { graphqlClient } from "@/gql/client";
import type { Mutation } from "@/mutations";

import { useAccounts } from "./accounts";
import { useActivities } from "./activities";
import { useAuth } from "./auth";
import { useMovements } from "./movements";
import { useProjects } from "./projects";
import { storage } from "./storage";
import { useWorkspaces } from "./workspaces";

interface SyncState {
  lastEventTimestamp: number;
  mutationsQueue: Mutation[];
  mutationsInProcessing: boolean;
  mutate: (mutation: Mutation) => void;
  dequeueMutations: () => Promise<void>;
  fetchMissingEvents: (workspace: string) => Promise<void>;
}

const missingEventsQuery = graphql(/* GraphQL */ `
  query MissingEvents(
      $lastSync: Float!,
      $workspace: String!
  ) {
    events(lastSync: $lastSync, workspace: $workspace) {
      type
      payload
      createdAt
      clientId
    }
  }
`);

export const useSync = create<SyncState>()(
  persist(
    (set, get) => ({
      lastEventTimestamp: 0,
      mutationsQueue: [],
      mutationsInProcessing: false,

      mutate: (mutation) => {
        set({
          mutationsQueue: [...get().mutationsQueue, mutation],
        });

        mutation.events
          .map((event) => {
            return {
              ...event,
              user: useAuth.getState().user!.id,
              clientId: useAuth.getState().session!.id,
              workspace: useWorkspaces.getState().currentWorkspace!.id,
              createdAt: new Date(),
            };
          })
          .forEach((event) => {
            useActivities.getState().handleEvent(event);
            useMovements.getState().handleEvent(event);
            useAccounts.getState().handleEvent(event);
            useProjects.getState().handleEvent(event);
          });

        void get().dequeueMutations();
      },

      dequeueMutations: async () => {
        if (get().mutationsInProcessing) return;
        set({
          mutationsInProcessing: true,
        });

        const mutation = get().mutationsQueue.at(0);
        if (!mutation) {
          set({
            mutationsInProcessing: false,
          });
          return;
        }

        console.log("Dequeueing mutations", mutation);

        try {
          const result = await graphqlClient.request(
            mutation.mutation,
            mutation.variables,
          );
          useActivities.getState().handleMutationSuccess({
            ...mutation,
            result,
          } as Mutation);
          useMovements.getState().handleMutationSuccess({
            ...mutation,
            result,
          } as Mutation);
          useProjects.getState().handleMutationSuccess({
            ...mutation,
            result,
          } as Mutation);

          set({
            mutationsInProcessing: false,
            mutationsQueue: get().mutationsQueue.splice(0, 1),
          });
          await get().dequeueMutations();
        } catch (e) {
          set({
            mutationsInProcessing: false,
          });
          if (!(e instanceof TypeError)) {
            useActivities.getState().handleMutationError(mutation);
            useMovements.getState().handleMutationError(mutation);
            useProjects.getState().handleMutationError(mutation);
            useAccounts.getState().handleMutationError(mutation);
          }
        }
      },

      fetchMissingEvents: async (workspace) => {
        const missingEventsRequest = await graphqlClient.request(
          missingEventsQuery,
          {
            lastSync: get().lastEventTimestamp,
            workspace,
          },
        );
        set({
          lastEventTimestamp: Date.now() / 1000,
        });

        const clientId = useAuth.getState().session?.id;
        if (!clientId) {
          throw new Error("session not defined");
        }

        missingEventsRequest.events
          .map(
            (event) =>
              ({
                ...event,
                payload: JSON.parse(event.payload),
                createdAt: new Date(event.createdAt),
                user: useAuth.getState().user!.id,
                workspace,
              }) as SyncEvent,
          )
          .forEach((event) => {
            useActivities.getState().handleEvent(event);
            useMovements.getState().handleEvent(event);
            useProjects.getState().handleEvent(event);
            useAccounts.getState().handleEvent(event);
          });
      },
    }),
    {
      name: "sync",
      storage: storage,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["mutationsInProcessing"].includes(key),
          ),
        ),
    },
  ),
);
