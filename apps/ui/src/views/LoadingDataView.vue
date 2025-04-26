<script setup lang="ts">
import { graphql } from "@/gql";
import { useAccountsStore } from "@/stores/accounts";
import { useActivitiesStore } from "@/stores/activities";
import { useContactsStore } from "@/stores/contacts";
import { useEventsStore } from "@/stores/events";
import { useLiabilitiesStore } from "@/stores/liabilities";
import { useMovementsStore } from "@/stores/movements";
import { useProjectsStore } from "@/stores/projects";
import { useSettingsStore } from "@/stores/settings";
import type { AccountType } from "@maille/core/accounts";
import type { ActivityStatus, ActivityType } from "@maille/core/activities";
import type { Liability } from "@maille/core/liabilities";
import type { Movement } from "@maille/core/movements";
import dayjs from "dayjs";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";

const eventsStore = useEventsStore();
const { lastEventTimestamp } = storeToRefs(eventsStore);

const router = useRouter();

const loadInitialData = async () => {
  const initialDataQuery = graphql(/* GraphQL */ `
    query InitialData {
      activities {
        id
        number
        name
        description
        date
        type
        category
        subcategory
        project
        transactions {
          id
          amount
          fromAccount
          toAccount
        }
        movements {
          id
          movement
          amount
        }
        amount
        status
      }

      activityCategories {
        id
        name
        type
      }

      activitySubcategories {
        id
        name
        category
      }

      accounts {
        id
        name
        type
        default
        startingBalance
        startingCashBalance
        movements
      }

      settings {
        startingPeriod
        currency
      }

      movements {
        id
        date
        amount
        account
        name
        activities {
          id
          activity
          amount
        }
        status
      }

      contacts {
        id
        contact
        contactEmail
        approved
        liabilityAccount
      }

      liabilities {
        activity
        amount
        account
        name
        date
        status
        linkedAmount
        linkId
      }

      projects {
        id
        name
        emoji
        startDate
        endDate
      }
    }
  `);
  const initialDataRequest = await eventsStore.client.request(initialDataQuery);

  lastEventTimestamp.value = Date.now() / 1000;
  eventsStore.subscribe();

  const settingsStore = useSettingsStore();
  const { settings } = storeToRefs(settingsStore);
  settings.value = initialDataRequest.settings;

  const activitiesStore = useActivitiesStore();
  const { activities, categories, subcategories } =
    storeToRefs(activitiesStore);
  activities.value = initialDataRequest.activities.map((a) => ({
    ...a,
    type: a.type as ActivityType,
    date: dayjs(a.date),
    status: a.status as ActivityStatus,
  }));
  categories.value = initialDataRequest.activityCategories.map((c) => ({
    ...c,
    type: c.type as ActivityType,
  }));
  subcategories.value = initialDataRequest.activitySubcategories;

  const accountsStore = useAccountsStore();
  const { accounts } = storeToRefs(accountsStore);
  accounts.value = initialDataRequest.accounts.map((a) => ({
    ...a,
    type: a.type as AccountType,
  }));

  const movementsStore = useMovementsStore();
  const { movements } = storeToRefs(movementsStore);
  movements.value = initialDataRequest.movements.map((m) => ({
    ...m,
    date: dayjs(m.date),
    status: m.status as Movement["status"],
  }));

  const contactsStore = useContactsStore();
  const { contacts } = storeToRefs(contactsStore);
  contacts.value = initialDataRequest.contacts;

  const liabilitiesStore = useLiabilitiesStore();
  const { liabilities } = storeToRefs(liabilitiesStore);
  liabilities.value = initialDataRequest.liabilities.map((l) => ({
    ...l,
    linkedAmount: l.linkedAmount ?? undefined,
    status: l.status as Liability["status"],
  }));

  const projectsStore = useProjectsStore();
  const { projects } = storeToRefs(projectsStore);
  projects.value = initialDataRequest.projects.map((p) => ({
    ...p,
    startDate: p.startDate ? dayjs(p.startDate) : null,
    endDate: p.endDate ? dayjs(p.endDate) : null,
  }));

  router.replace({ name: "dashboard" });
};

loadInitialData();
</script>

<template>
  <div class="flex h-full w-full items-center justify-center text-primary-200">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="45"
      height="45"
      viewBox="0 0 45 45"
      stroke="currentColor"
    >
      <g
        fill="none"
        fill-rule="evenodd"
        transform="translate(1 1)"
        stroke-width="2"
      >
        <circle cx="22" cy="22" r="6" stroke-opacity="0">
          <animate
            attributeName="r"
            begin="1.5s"
            dur="3s"
            values="6;22"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            begin="1.5s"
            dur="3s"
            values="1;0"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            begin="1.5s"
            dur="3s"
            values="2;0"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="22" cy="22" r="6" stroke-opacity="0">
          <animate
            attributeName="r"
            begin="3s"
            dur="3s"
            values="6;22"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            begin="3s"
            dur="3s"
            values="1;0"
            calcMode="linear"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            begin="3s"
            dur="3s"
            values="2;0"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="22" cy="22" r="8">
          <animate
            attributeName="r"
            begin="0s"
            dur="1.5s"
            values="6;1;2;3;4;5;6"
            calcMode="linear"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </svg>
  </div>
</template>
