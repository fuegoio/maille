import { graphql } from "./gql";
import { graphqlClient } from "./gql/client";
import { workspacesStore } from "./stores/workspaces";
import { accountsStore } from "./stores/accounts";
import { activitiesStore } from "./stores/activities";
import { movementsStore } from "./stores/movements";
import { projectsStore } from "./stores/projects";
import { liabilitiesStore } from "./stores/liabilities";
import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";
import type { UUID } from "crypto";

const workspaceDataQuery = graphql(/* GraphQL */ `
  query WorkspaceData($workspace: UUID!) {
    workspace(id: $workspace) {
      id
      name
      startingDate
      currency
      createdAt
      users {
        id
        name
        email
        image
      }
    }

    activities(workspaceId: $workspace) {
      id
      user
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

    activityCategories(workspaceId: $workspace) {
      id
      name
      type
    }

    activitySubcategories(workspaceId: $workspace) {
      id
      name
      category
    }

    accounts(workspaceId: $workspace) {
      id
      name
      type
      default
      startingBalance
      startingCashBalance
      movements
    }

    movements(workspaceId: $workspace) {
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

    projects(workspaceId: $workspace) {
      id
      name
      emoji
      startDate
      endDate
    }
  }
`);

/**
 * Fetch workspace data and populate all stores
 */
export const fetchWorkspaceData = async (workspaceId: UUID) => {
  const workspaceData = await graphqlClient.request(workspaceDataQuery, {
    workspace: workspaceId,
  });

  // Set workspace data
  workspacesStore.getState().setCurrentWorkspace({
    ...workspaceData.workspace,
    startingDate: new Date(workspaceData.workspace.startingDate),
  });

  // Clear existing data and populate stores
  accountsStore.setState({ accounts: [] });
  activitiesStore.setState({
    activities: [],
    activityCategories: [],
    activitySubcategories: [],
  });
  movementsStore.setState({ movements: [] });
  projectsStore.setState({ projects: [] });
  liabilitiesStore.setState({ liabilities: [] });

  // Populate accounts
  workspaceData.accounts.forEach((account) => {
    accountsStore.getState().addAccount({
      id: account.id,
      name: account.name,
      type: account.type as AccountType,
      isDefault: account.default,
      movements: account.movements,
    });
  });

  // Populate activities
  workspaceData.activities.forEach((activity) => {
    activitiesStore.getState().addActivity({
      id: activity.id,
      user: activity.user,
      number: activity.number,
      name: activity.name,
      description: activity.description,
      date: new Date(activity.date),
      type: activity.type as ActivityType,
      category: activity.category,
      subcategory: activity.subcategory,
      project: activity.project,
      transactions: activity.transactions,
      movements: activity.movements,
    });
  });

  // Populate activity categories
  workspaceData.activityCategories.forEach((category) => {
    activitiesStore.getState().addActivityCategory({
      id: category.id,
      name: category.name,
      type: category.type as ActivityType,
    });
  });

  // Populate activity subcategories
  workspaceData.activitySubcategories.forEach((subcategory) => {
    activitiesStore.getState().addActivitySubcategory({
      id: subcategory.id,
      name: subcategory.name,
      category: subcategory.category,
    });
  });

  // Populate movements
  workspaceData.movements.forEach((movement) => {
    movementsStore.getState().addMovement({
      id: movement.id,
      date: new Date(movement.date),
      amount: movement.amount,
      account: movement.account,
      name: movement.name,
      activities: movement.activities,
    });
  });

  return workspaceData;
};

/**
 * Clear all stores data
 */
export const clearAllStores = () => {
  accountsStore.setState({ accounts: [] });
  activitiesStore.setState({
    activities: [],
    activityCategories: [],
    activitySubcategories: [],
  });
  movementsStore.setState({ movements: [] });
  projectsStore.setState({ projects: [] });
  liabilitiesStore.setState({ liabilities: [] });
  workspacesStore.setState({
    currentWorkspace: null,
    availableWorkspaces: null,
  });
};
