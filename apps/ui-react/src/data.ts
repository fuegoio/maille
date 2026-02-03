import { graphql } from "./gql";
import { graphqlClient } from "./gql/client";
import { workspacesStore } from "./stores/workspaces";

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

export const fetchWorkspaceData = async (workspaceId: string) => {
  const workspaceData = await graphqlClient.request(workspaceDataQuery, {
    workspace: workspaceId,
  });

  workspacesStore.getState().setCurrentWorkspace({
    ...workspaceData.workspace,
    startingDate: new Date(workspaceData.workspace.startingDate),
  });
};
