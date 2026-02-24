import type { Project } from "@maille/core/projects";
import type {
  CreateProjectEvent,
  DeleteProjectEvent,
  UpdateProjectEvent,
} from "@maille/core/sync";

import { graphql } from "@/gql";

import type { MutationType } from "./type";

export const createProjectMutation = graphql(/* GraphQL */ `
  mutation CreateProject(
    $id: String!
    $name: String!
    $emoji: String
  ) {
    createProject(id: $id, name: $name, emoji: $emoji) {
      id
    }
  }
`);

export const updateProjectMutation = graphql(/* GraphQL */ `
  mutation UpdateProject(
    $id: String!
    $name: String
    $emoji: String
    $startDate: Date
    $endDate: Date
  ) {
    updateProject(
      id: $id
      name: $name
      emoji: $emoji
      startDate: $startDate
      endDate: $endDate
    ) {
      id
    }
  }
`);

export const deleteProjectMutation = graphql(/* GraphQL */ `
  mutation DeleteProject($id: String!) {
    deleteProject(id: $id)
  }
`);

export type CreateProjectMutation = MutationType<
  "createProject",
  typeof createProjectMutation,
  undefined,
  [CreateProjectEvent]
>;

export type UpdateProjectMutation = MutationType<
  "updateProject",
  typeof updateProjectMutation,
  Project,
  [UpdateProjectEvent]
>;

export type DeleteProjectMutation = MutationType<
  "deleteProject",
  typeof deleteProjectMutation,
  { project: Project; activities: string[] },
  [DeleteProjectEvent]
>;

export type ProjectMutation =
  | CreateProjectMutation
  | UpdateProjectMutation
  | DeleteProjectMutation;
