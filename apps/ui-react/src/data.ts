import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";

import { graphql } from "./gql";
import { graphqlClient } from "./gql/client";
import { useAccounts } from "./stores/accounts";
import { useActivities } from "./stores/activities";
import { useLiabilities } from "./stores/liabilities";
import { useMovements } from "./stores/movements";
import { useProjects } from "./stores/projects";
import { useWorkspaces } from "./stores/workspaces";

const workspaceDataQuery = graphql(/* GraphQL */ `
  query WorkspaceData($workspace: String!) {
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
export const fetchWorkspaceData = async (workspaceId: string) => {
  const workspaceData = await graphqlClient.request(workspaceDataQuery, {
    workspace: workspaceId,
  });

  // Set workspace data
  useWorkspaces.getState().setCurrentWorkspace({
    ...workspaceData.workspace,
    startingDate: new Date(workspaceData.workspace.startingDate),
  });

  // Clear existing data and populate stores
  useAccounts.setState({ accounts: [] });
  useActivities.setState({
    activities: [],
    activityCategories: [],
    activitySubcategories: [],
  });
  useMovements.setState({ movements: [] });
  useProjects.setState({ projects: [] });
  useLiabilities.setState({ liabilities: [] });

  // Populate accounts
  workspaceData.accounts.forEach((account) => {
    useAccounts.getState().addAccount({
      id: account.id,
      name: account.name,
      type: account.type as AccountType,
      isDefault: account.default,
      movements: account.movements,
    });
  });

  // Populate activities
  workspaceData.activities.forEach((activity) => {
    useActivities.getState().addActivity({
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
    useActivities.getState().addActivityCategory({
      id: category.id,
      name: category.name,
      type: category.type as ActivityType,
    });
  });

  // Populate activity subcategories
  workspaceData.activitySubcategories.forEach((subcategory) => {
    useActivities.getState().addActivitySubcategory({
      id: subcategory.id,
      name: subcategory.name,
      category: subcategory.category,
    });
  });

  // Populate movements
  workspaceData.movements.forEach((movement) => {
    useMovements.getState().addMovement({
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
  useAccounts.setState({ accounts: [] });
  useActivities.setState({
    activities: [],
    activityCategories: [],
    activitySubcategories: [],
  });
  useMovements.setState({ movements: [] });
  useProjects.setState({ projects: [] });
  useLiabilities.setState({ liabilities: [] });
  useWorkspaces.setState({
    currentWorkspace: null,
    availableWorkspaces: null,
  });
};
