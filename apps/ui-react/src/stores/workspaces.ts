import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace } from "@maille/core/workspaces";
import { graphqlClient } from "@/gql/client";
import { graphql } from "@/gql";
import type { string } from "crypto";
import { storage } from "./storage";

export interface AvailableWorkspace {
  id: string;
  name: string;
}

const WorkspacesQuery = graphql(`
  query Workspaces {
    workspaces {
      id
      name
    }
  }
`);

interface WorkspacesState {
  currentWorkspace: Workspace | null;
  availableWorkspaces: AvailableWorkspace[] | null;
  fetchWorkspaces: () => Promise<AvailableWorkspace[]>;
  createWorkspace: (workspace: Workspace) => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
}

export const workspacesStore = createStore<WorkspacesState>()(
  persist(
    (set, get) => ({
      currentWorkspace: null,
      availableWorkspaces: null,
      fetchWorkspaces: async () => {
        const workspacesQuery = await graphqlClient.request(WorkspacesQuery);
        const workspaces = workspacesQuery.workspaces;
        set({
          availableWorkspaces: workspaces,
        });
        return workspaces;
      },
      createWorkspace: (workspace) => {
        const availableWorkspaces = get().availableWorkspaces;
        set({
          availableWorkspaces: availableWorkspaces?.concat([
            {
              id: workspace.id,
              name: workspace.name,
            },
          ]),
          currentWorkspace: workspace,
        });
      },
      setCurrentWorkspace: (workspace) => {
        set({
          currentWorkspace: workspace,
        });
      },
    }),
    {
      name: "workspaces",
      storage: storage,
    },
  ),
);
