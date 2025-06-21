import type { AccountMutation } from "./accounts";
import type { ActivityMutation } from "./activities";
import type { LiabilityMutation } from "./liabilities";
import type { MovementMutation } from "./movements";
import type { ProjectMutation } from "./projects";
import type { UserMutation } from "./users";

export type Mutation =
  | ActivityMutation
  | LiabilityMutation
  | MovementMutation
  | ProjectMutation
  | AccountMutation
  | UserMutation;
