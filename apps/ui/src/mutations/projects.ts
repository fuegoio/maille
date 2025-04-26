import { graphql } from "@/gql";
import type { MutationType } from "./type";
import type { Project } from "@maille/core/projects";
import type { UUID } from "crypto";

export const createProjectMutation = graphql(/* GraphQL */ `
  mutation CreateProject($id: UUID!, $name: String!, $emoji: String) {
    createProject(id: $id, name: $name, emoji: $emoji) {
      id
    }
  }
`);

export const updateProjectMutation = graphql(/* GraphQL */ `
  mutation UpdateProject(
    $id: UUID!
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
  mutation DeleteProject($id: UUID!) {
    deleteProject(id: $id)
  }
`);

export type CreateProjectMutation = MutationType<
  "createProject",
  typeof createProjectMutation,
  undefined
>;

export type UpdateProjectMutation = MutationType<
  "updateProject",
  typeof updateProjectMutation,
  Project
>;

export type DeleteProjectMutation = MutationType<
  "deleteProject",
  typeof deleteProjectMutation,
  { project: Project; activities: UUID[] }
>;

export type ProjectMutation =
  | CreateProjectMutation
  | UpdateProjectMutation
  | DeleteProjectMutation;
