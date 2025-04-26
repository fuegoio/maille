import { defineStore } from "pinia";
import { createClient } from "graphql-sse";
import { useActivitiesStore } from "./activities";
import { useStorage } from "@vueuse/core";
import { useAuthStore } from "./auth";
import { GraphQLClient } from "graphql-request";
import type { SyncEvent } from "@maille/core/sync";
import type { UUID } from "crypto";
import { computed, ref, watch } from "vue";
import { graphql } from "@/gql";
import { useNetwork } from "@vueuse/core";
import type { Mutation } from "@/mutations";
import { useMovementsStore } from "./movements";
import { useProjectsStore } from "./projects";

export const useEventsStore = defineStore("events", () => {
  const authStore = useAuthStore();
  const activitiesStore = useActivitiesStore();
  const movementsStore = useMovementsStore();
  const projectsStore = useProjectsStore();

  const clientId = useStorage<string | undefined>("client_id", undefined);
  const lastEventTimestamp = useStorage<number>("last_event_timestamp", 0);

  const eventsQueue = useStorage<Mutation[]>("events_queue", []);
  const eventInProcessing = ref(false);

  const { isOnline } = useNetwork();

  const client = computed(
    () =>
      new GraphQLClient("http://localhost:3000/graphql", {
        headers: {
          Authorization: `Bearer ${authStore.authToken}`,
        },
      }),
  );

  const sendEvent = (event: Mutation) => {
    eventsQueue.value.push(event);
    dequeueEvents();
  };

  const dequeueEvents = async () => {
    if (!isOnline.value) return;

    if (eventInProcessing.value) return;
    eventInProcessing.value = true;

    const event = eventsQueue.value.shift();
    if (!event) {
      eventInProcessing.value = false;
      return;
    }

    console.log("Dequeueing event", event);

    try {
      const result = await client.value.request(
        event.mutation,
        event.variables,
      );
      activitiesStore.handleMutationSuccess({
        ...event,
        result,
      } as Mutation);
      movementsStore.handleMutationSuccess({
        ...event,
        result,
      } as Mutation);
      projectsStore.handleMutationSuccess({
        ...event,
        result,
      } as Mutation);

      eventInProcessing.value = false;
      await dequeueEvents();
    } catch (e) {
      eventInProcessing.value = false;
      if (e instanceof TypeError) {
        eventsQueue.value.unshift(event);
      } else {
        activitiesStore.handleMutationError(event);
        movementsStore.handleMutationError(event);
        projectsStore.handleMutationError(event);
      }
    }
  };

  const eventsQueueLength = computed(() => eventsQueue.value.length);

  const streamClient = computed(() =>
    createClient({
      url: "http://localhost:3000/graphql/stream",
      singleConnection: true,
      headers: { Authorization: `Bearer ${authStore.authToken}` },
    }),
  );

  const subscribe = async () => {
    const subscription = streamClient.value.iterate({
      query: "subscription { events { type, payload, createdAt, clientId } }",
    });

    for await (const eventSerialized of subscription) {
      console.log("Received event", eventSerialized.data);
      const eventData = eventSerialized.data!.events as {
        type: SyncEvent["type"];
        payload: string;
        createdAt: number;
        clientId: UUID;
      };
      lastEventTimestamp.value = eventData.createdAt;
      if (eventData.clientId === clientId.value) continue;

      const event: SyncEvent = {
        type: eventData.type,
        payload: JSON.parse(eventData.payload),
        createdAt: new Date(eventData.createdAt * 1000),
        clientId: eventData.clientId,
        user: authStore.user!.id,
      };

      activitiesStore.handleEvent(event);
      movementsStore.handleEvent(event);
      projectsStore.handleEvent(event);
    }
  };

  const fetchMissingEvents = async () => {
    const missingEventsQuery = graphql(/* GraphQL */ `
      query MissingEvents($lastSync: Float!) {
        events(lastSync: $lastSync) {
          type
          payload
          createdAt
          clientId
        }
      }
    `);
    const missingEventsRequest = await client.value.request(
      missingEventsQuery,
      { lastSync: lastEventTimestamp.value! },
    );
    lastEventTimestamp.value = Date.now() / 1000;

    missingEventsRequest.events
      .filter((e) => e.clientId !== clientId.value)
      .map(
        (e) =>
          ({
            type: e.type,
            payload: JSON.parse(e.payload),
            createdAt: new Date(e.createdAt * 1000),
            clientId: e.clientId,
          }) as SyncEvent,
      )
      .forEach((event) => {
        activitiesStore.handleEvent(event);
        movementsStore.handleEvent(event);
        projectsStore.handleEvent(event);
      });
  };

  const reconcileEvents = async () => {
    await dequeueEvents();
    if (eventsQueue.value.length === 0) {
      await fetchMissingEvents();
    }
  };

  watch(isOnline, (isOnline, wasOnline) => {
    if (!wasOnline && isOnline) {
      reconcileEvents();
    }
  });

  return {
    client,
    clientId,
    lastEventTimestamp,
    eventsQueueLength,
    isOnline,

    subscribe,
    sendEvent,

    reconcileEvents,
  };
});
