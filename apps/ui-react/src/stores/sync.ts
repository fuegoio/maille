import type { SyncEvent } from "@maille/core/sync";
import { ClientError } from "graphql-request";
import { createClient, type Client } from "graphql-sse";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { graphql } from "@/gql";
import { graphqlClient } from "@/gql/client";
import { baseApiURL } from "@/lib/api";
import type { Mutation } from "@/mutations";

import { useAccounts } from "./accounts";
import { useActivities } from "./activities";
import { useAssets } from "./assets";
import { useAuth } from "./auth";
import { useCounterparties } from "./counterparties";
import { useMovements } from "./movements";
import { useProjects } from "./projects";
import { storage } from "./storage";

interface SyncState {
  lastEventTimestamp: number;
  mutationsQueue: Mutation[];
  mutationsInProcessing: boolean;
  syncClient: Client<true> | null;
  mutate: (mutation: Mutation) => void;
  dequeueMutations: () => Promise<void>;
  fetchMissingEvents: () => Promise<void>;
  subscribe: () => Promise<void>;
  clear: () => void;
}

const missingEventsQuery = graphql(/* GraphQL */ `
  query MissingEvents(
      $lastSync: Float!,
  ) {
    events(lastSync: $lastSync) {
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
      syncClient: null,

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
              createdAt: new Date(),
            };
          })
          .forEach((event) => {
            useActivities.getState().handleEvent(event);
            useMovements.getState().handleEvent(event);
            useAccounts.getState().handleEvent(event);
            useProjects.getState().handleEvent(event);
            useAssets.getState().handleEvent(event);
            useCounterparties.getState().handleEvent(event);
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
          useAssets.getState().handleMutationSuccess({
            ...mutation,
            result,
          } as Mutation);
          useCounterparties.getState().handleMutationSuccess({
            ...mutation,
            result,
          } as Mutation);

          set({
            mutationsInProcessing: false,
            mutationsQueue: get().mutationsQueue.slice(1),
          });
          await get().dequeueMutations();
        } catch (e) {
          if (e instanceof TypeError) {
            set({
              mutationsInProcessing: false,
            });
            return;
          }

          if (e instanceof ClientError) {
            if (e.response.status === 500) {
              set({
                mutationsInProcessing: false,
              });
              return;
            }
          }

          set({
            mutationsInProcessing: false,
            mutationsQueue: get().mutationsQueue.slice(1),
          });
          console.error(e);
          useActivities.getState().handleMutationError(mutation);
          useMovements.getState().handleMutationError(mutation);
          useProjects.getState().handleMutationError(mutation);
          useAccounts.getState().handleMutationError(mutation);
          useAssets.getState().handleMutationError(mutation);
          useCounterparties.getState().handleMutationError(mutation);
          await get().dequeueMutations();
        }
      },

      fetchMissingEvents: async () => {
        const missingEventsRequest = await graphqlClient.request(
          missingEventsQuery,
          {
            lastSync: get().lastEventTimestamp,
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
              }) as SyncEvent,
          )
          .forEach((event) => {
            useActivities.getState().handleEvent(event);
            useMovements.getState().handleEvent(event);
            useProjects.getState().handleEvent(event);
            useAccounts.getState().handleEvent(event);
            useAssets.getState().handleEvent(event);
            useCounterparties.getState().handleEvent(event);
          });
      },

      subscribe: async () => {
        if (get().syncClient !== null) return;
        const client = createClient({
          url: `${baseApiURL}/graphql/stream`,
          singleConnection: true,
          credentials: "include",
          on: {
            connecting: (reconnecting) => {
              console.log("Connecting", reconnecting);
            },
          },
          lazy: false,
        });
        set({ syncClient: client });

        await get().fetchMissingEvents();

        const subscription = client.iterate({
          query:
            "subscription { events { type, payload, createdAt, clientId } }",
        });

        const clientId = useAuth.getState().session!.id;
        console.log("Events subscription started");

        for await (const eventSerialized of subscription) {
          console.log("Received event", eventSerialized.data);
          const eventData = eventSerialized.data!.events as {
            type: SyncEvent["type"];
            payload: string;
            createdAt: number;
            clientId: string;
          };
          set({
            lastEventTimestamp: eventData.createdAt,
          });
          if (eventData.clientId === clientId) continue;

          const event = {
            type: eventData.type,
            payload: JSON.parse(eventData.payload),
            createdAt: new Date(eventData.createdAt * 1000),
            clientId: eventData.clientId,
          } as SyncEvent;

          useActivities.getState().handleEvent(event);
          useMovements.getState().handleEvent(event);
          useProjects.getState().handleEvent(event);
          useAccounts.getState().handleEvent(event);
          useAssets.getState().handleEvent(event);
          useCounterparties.getState().handleEvent(event);
        }

        console.log("Finished subscription");
      },

      clear: () => {
        set({
          lastEventTimestamp: 0,
          mutationsQueue: [],
          mutationsInProcessing: false,
        });
      },
    }),
    {
      name: "sync",
      storage: storage,
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !["mutationsInProcessing", "syncClient"].includes(key),
          ),
        ),
    },
  ),
);
