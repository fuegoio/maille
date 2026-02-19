import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";

import { graphql } from "./gql";
import { graphqlClient } from "./gql/client";
import { useAccounts } from "./stores/accounts";
import { useActivities } from "./stores/activities";
import { useAssets } from "./stores/assets";
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
        fromAsset
        fromCounterparty
        toAccount
        toAsset
        toCounterparty
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
      user
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

    assets(workspaceId: $workspace) {
      id
      account
      name
      description
      location
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

  // Populate accounts
  workspaceData.accounts.forEach((account) => {
    useAccounts.getState().addAccount({
      ...account,
      type: account.type as AccountType,
    });
  });

  // Populate movements
  workspaceData.movements.forEach((movement) => {
    useMovements.getState().addMovement({
      ...movement,
      date: new Date(movement.date),
    });
  });

  // Populate activities
  workspaceData.activities.forEach((activity) => {
    useActivities.getState().addActivity({
      ...activity,
      date: new Date(activity.date),
      type: activity.type as ActivityType,
    });
  });

  // Populate activity categories
  workspaceData.activityCategories.forEach((category) => {
    useActivities.getState().addActivityCategory({
      ...category,
      type: category.type as ActivityType,
    });
  });

  // Populate activity subcategories
  workspaceData.activitySubcategories.forEach((subcategory) => {
    useActivities.getState().addActivitySubcategory({
      ...subcategory,
    });
  });

  // Populate projects
  workspaceData.projects.forEach((project) => {
    useProjects.getState().addProject({
      ...project,
      startDate: project.startDate ? new Date(project.startDate) : null,
      endDate: project.endDate ? new Date(project.endDate) : null,
    });
  });

  // Populate assets
  workspaceData.assets.forEach((asset) => {
    useAssets.getState().addAsset({
      ...asset,
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
  useAssets.setState({ assets: [] });
  useMovements.setState({ movements: [] });
  useProjects.setState({ projects: [] });
  useWorkspaces.setState({
    currentWorkspace: null,
    availableWorkspaces: null,
  });
};
