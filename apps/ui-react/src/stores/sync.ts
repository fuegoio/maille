import type { SyncEvent } from "@maille/core/sync";
import { createStore } from "zustand";
import { persist } from "zustand/middleware";

import { graphql } from "@/gql";
import { graphqlClient } from "@/gql/client";
import type { Mutation } from "@/mutations";

import { accountsStore } from "./accounts";
import { activitiesStore } from "./activities";
import { authStore } from "./auth";
import { movementsStore } from "./movements";
import { projectsStore } from "./projects";
import { storage } from "./storage";
import { workspacesStore } from "./workspaces";

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

export const syncStore = createStore<SyncState>()(
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
              user: authStore.getState().user!.id,
              clientId: authStore.getState().session!.id,
              workspace: workspacesStore.getState().currentWorkspace!.id,
              createdAt: new Date(),
            };
          })
          .forEach((event) => {
            activitiesStore.getState().handleEvent(event);
            movementsStore.getState().handleEvent(event);
            accountsStore.getState().handleEvent(event);
            projectsStore.getState().handleEvent(event);
          });
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
          activitiesStore.getState().handleMutationSuccess({
            ...mutation,
            result,
          } as Mutation);
          movementsStore.getState().handleMutationSuccess({
            ...mutation,
            result,
          } as Mutation);
          projectsStore.getState().handleMutationSuccess({
            ...mutation,
            result,
          } as Mutation);
          accountsStore.getState().handleMutationSuccess({
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
            activitiesStore.getState().handleMutationError(mutation);
            movementsStore.getState().handleMutationError(mutation);
            projectsStore.getState().handleMutationError(mutation);
            accountsStore.getState().handleMutationError(mutation);
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

        const clientId = authStore.getState().session?.id;
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
                user: authStore.getState().user!.id,
                workspace,
              }) as SyncEvent,
          )
          .forEach((event) => {
            activitiesStore.getState().handleEvent(event);
            movementsStore.getState().handleEvent(event);
            projectsStore.getState().handleEvent(event);
            accountsStore.getState().handleEvent(event);
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
