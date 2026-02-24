import { AccountType } from "@maille/core/accounts";
import { ActivityType } from "@maille/core/activities";

import { graphql } from "./gql";
import { graphqlClient } from "./gql/client";
import { useAccounts } from "./stores/accounts";
import { useActivities } from "./stores/activities";
import { useAssets } from "./stores/assets";
import { useCounterparties } from "./stores/counterparties";
import { useMovements } from "./stores/movements";
import { useProjects } from "./stores/projects";
import { useSync } from "./stores/sync";

const userDataQuery = graphql(/* GraphQL */ `
  query UserData() {
    activities() {
      id
      users
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
      liabilities { 
        user
        amount
      }
    }

    activityCategories() {
      id
      name
      type
    }

    activitySubcategories() {
      id
      name
      category
    }

    accounts() {
      id
      name
      type
      default
      startingBalance
      startingCashBalance
      movements
      user
    }

    movements() {
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

    projects() {
      id
      name
      emoji
      startDate
      endDate
    }

    assets() {
      id
      account
      name
      description
      location
    }
    
    counterparties() {
      id
      account
      name
      description
      contact
    }
  }
`);

export const fetchUserData = async () => {
  const userData = await graphqlClient.request(userDataQuery);
  useSync.setState({
    lastEventTimestamp: Date.now(),
  });

  // Clear existing data and populate stores
  clearAllStores();

  // Populate accounts
  userData.accounts.forEach((account) => {
    useAccounts.getState().addAccount({
      ...account,
      type: account.type as AccountType,
    });
  });

  // Populate movements
  userData.movements.forEach((movement) => {
    useMovements.getState().addMovement({
      ...movement,
      date: new Date(movement.date),
    });
  });

  // Populate activities
  userData.activities.forEach((activity) => {
    useActivities.getState().addActivity({
      ...activity,
      date: new Date(activity.date),
      type: activity.type as ActivityType,
    });
  });

  // Populate activity categories
  userData.activityCategories.forEach((category) => {
    useActivities.getState().addActivityCategory({
      ...category,
      type: category.type as ActivityType,
    });
  });

  // Populate activity subcategories
  userData.activitySubcategories.forEach((subcategory) => {
    useActivities.getState().addActivitySubcategory({
      ...subcategory,
    });
  });

  // Populate projects
  userData.projects.forEach((project) => {
    useProjects.getState().addProject({
      ...project,
      startDate: project.startDate ? new Date(project.startDate) : null,
      endDate: project.endDate ? new Date(project.endDate) : null,
    });
  });

  // Populate assets
  userData.assets.forEach((asset) => {
    useAssets.getState().addAsset({
      ...asset,
    });
  });

  // Populate counterparties
  userData.counterparties.forEach((counterparty) => {
    useCounterparties.getState().addCounterparty({
      ...counterparty,
    });
  });

  return userData;
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
  useCounterparties.setState({ counterparties: [] });
  useMovements.setState({ movements: [] });
  useProjects.setState({ projects: [] });
};
