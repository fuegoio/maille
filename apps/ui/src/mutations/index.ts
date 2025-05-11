import type { AccountMutation } from "./accounts";
import type { ActivityMutation } from "./activities";
import type { MovementMutation } from "./movements";
import type { ProjectMutation } from "./projects";
import type { UserMutation } from "./users";

export type Mutation =
  | ActivityMutation
  | MovementMutation
  | ProjectMutation
  | AccountMutation
  | UserMutation;
